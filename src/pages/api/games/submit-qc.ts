import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';
import { AuditLogger } from '../../../lib/audit';

/**
 * POST /api/games/submit-qc
 * Dev submits game for QC review
 * Changes status: draft/qc_failed -> uploaded
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

    // Check role
    const isDev = user.roles.includes('dev');
    const isAdmin = user.roles.includes('admin');
    if (!isDev && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
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

    // Check ownership (dev can only submit their own games)
    if (!isAdmin && game.ownerId !== user._id.toString()) {
      return new Response(JSON.stringify({ error: 'You can only submit your own games' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check current status
    if (!['draft', 'qc_failed'].includes(game.status)) {
      return new Response(JSON.stringify({ error: 'Game cannot be submitted in current status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const oldStatus = game.status;

    // Update status
    const updated = await gameRepo.updateStatus(gameId, 'uploaded');

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
        { field: 'status', oldValue: oldStatus, newValue: 'uploaded' },
      ],
    });

    return new Response(JSON.stringify({ success: true, game: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Submit QC error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
