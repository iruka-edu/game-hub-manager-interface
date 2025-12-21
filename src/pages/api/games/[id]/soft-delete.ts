import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { getUserFromRequest } from '../../../../lib/session';
import { canAdminSoftDelete, getDeleteReason } from '../../../../auth/deletion-rules';
import { AuditLogger } from '../../../../lib/audit';

/**
 * DELETE /api/games/[id]/soft-delete
 * Admin soft deletes a game (moves to trash)
 * 
 * Rules:
 * - Requires games:delete_soft permission (Admin)
 * - Can soft delete most games (policy decision)
 * - Performs soft delete (sets isDeleted = true)
 * - Does not touch GCS files
 * - Game can be restored later
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameId = params.id;
    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameRepo = await GameRepository.getInstance();
    
    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game || game.isDeleted) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check permissions using ABAC rules
    if (!canAdminSoftDelete(user, game)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden. You do not have permission to delete this game.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get delete reason from request body or use default
    const body = await request.json().catch(() => ({}));
    const customReason = body.reason;
    const deleteReason = customReason || getDeleteReason(user, 'admin');

    // Perform soft delete
    const now = new Date();
    
    const updatedGame = await gameRepo.update(gameId, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: user._id.toString(),
      deleteReason: deleteReason,
      updatedAt: now
    });

    if (!updatedGame) {
      return new Response(JSON.stringify({ error: 'Failed to delete game' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_SOFT_DELETE',
      target: {
        entity: 'GAME',
        id: gameId,
      },
      changes: [
        { field: 'isDeleted', oldValue: false, newValue: true },
        { field: 'deletedAt', oldValue: null, newValue: now.toISOString() },
        { field: 'deletedBy', oldValue: null, newValue: user._id.toString() },
        { field: 'deleteReason', oldValue: null, newValue: deleteReason },
      ],
      metadata: {
        gameTitle: game.title,
        gameSlug: game.gameId,
        deleteType: 'admin_soft',
        preserveFiles: true,
        canRestore: true,
        customReason: customReason || null
      }
    });

    return new Response(JSON.stringify({ 
      message: 'Game moved to trash successfully',
      gameId: gameId,
      deletedAt: now.toISOString(),
      canRestore: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin soft delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};