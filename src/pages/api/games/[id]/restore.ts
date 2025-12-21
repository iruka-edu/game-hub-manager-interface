import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { getUserFromRequest } from '../../../../lib/session';
import { canRestoreGame } from '../../../../auth/deletion-rules';
import { AuditLogger } from '../../../../lib/audit';

/**
 * POST /api/games/[id]/restore
 * Admin restores a soft-deleted game from trash
 * 
 * Rules:
 * - Requires games:restore permission (Admin)
 * - Can only restore soft-deleted games
 * - Sets isDeleted = false and clears deletion metadata
 */
export const POST: APIRoute = async ({ params, request }) => {
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
    
    // Find the game (including deleted ones)
    const game = await gameRepo.findByIdIncludeDeleted(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check permissions using ABAC rules
    if (!canRestoreGame(user, game)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden. You can only restore soft-deleted games.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store old deletion metadata for audit
    const oldDeletionData = {
      deletedAt: game.deletedAt,
      deletedBy: game.deletedBy,
      deleteReason: game.deleteReason
    };

    // Restore the game
    const now = new Date();
    
    const updatedGame = await gameRepo.update(gameId, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deleteReason: undefined,
      updatedAt: now
    });

    if (!updatedGame) {
      return new Response(JSON.stringify({ error: 'Failed to restore game' }), {
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
      action: 'GAME_RESTORE',
      target: {
        entity: 'GAME',
        id: gameId,
      },
      changes: [
        { field: 'isDeleted', oldValue: true, newValue: false },
        { field: 'deletedAt', oldValue: oldDeletionData.deletedAt?.toISOString() || null, newValue: null },
        { field: 'deletedBy', oldValue: oldDeletionData.deletedBy || null, newValue: null },
        { field: 'deleteReason', oldValue: oldDeletionData.deleteReason || null, newValue: null },
      ],
      metadata: {
        gameTitle: game.title,
        gameSlug: game.gameId,
        restoredBy: user._id.toString(),
        originalDeleteReason: oldDeletionData.deleteReason,
        originalDeletedBy: oldDeletionData.deletedBy,
        originalDeletedAt: oldDeletionData.deletedAt?.toISOString()
      }
    });

    return new Response(JSON.stringify({ 
      message: 'Game restored successfully',
      gameId: gameId,
      restoredAt: now.toISOString(),
      originalDeleteReason: oldDeletionData.deleteReason
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Game restore error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};