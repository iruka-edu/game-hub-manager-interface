import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { getUserFromRequest } from '../../../../lib/session';
import { canDevSoftDeleteDraft, getDeleteReason } from '../../../../auth/deletion-rules';
import { AuditLogger } from '../../../../lib/audit';

/**
 * DELETE /api/games/[id]/dev-draft
 * Dev soft deletes their own draft game
 * 
 * Rules:
 * - Only game owner can delete
 * - Only draft games that haven't been to QC
 * - Performs soft delete (sets isDeleted = true)
 * - Does not touch GCS files
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
    if (!canDevSoftDeleteDraft(user, game)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden. You can only delete your own draft games that haven\'t been submitted to QC.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform soft delete
    const now = new Date();
    const deleteReason = getDeleteReason(user, 'draft');
    
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
        deleteType: 'dev_draft',
        preserveFiles: true
      }
    });

    return new Response(JSON.stringify({ 
      message: 'Game deleted successfully',
      gameId: gameId,
      deletedAt: now.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dev draft delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};