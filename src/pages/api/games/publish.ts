import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';
import { AuditLogger } from '../../../lib/audit';
import { NotificationService } from '../../../lib/notification';
import { GameHistoryService } from '../../../lib/game-history';

/**
 * POST /api/games/publish
 * Admin publishes a game
 * Changes status: approved/archived -> published
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check role - only admin
    const isAdmin = user.roles.includes('admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Only admin can publish' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return new Response(JSON.stringify({ error: 'gameId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const game = await gameRepo.findById(gameId);

    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check current status
    if (!['approved', 'archived'].includes(game.status)) {
      return new Response(JSON.stringify({ error: 'Game must be approved to publish' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const oldStatus = game.status;

    // Update status
    const updated = await gameRepo.updateStatus(gameId, 'published');

    // Record history
    await GameHistoryService.recordPublication(gameId, user);

    // Notify owner
    await NotificationService.notifyGamePublished(
      game.ownerId,
      game.title || game.gameId,
      gameId
    );

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_STATUS_CHANGE',
      target: {
        entity: 'GAME',
        id: gameId,
      },
      changes: [
        { field: 'status', oldValue: oldStatus, newValue: 'published' },
      ],
    });

    return new Response(JSON.stringify({ success: true, game: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Publish error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
