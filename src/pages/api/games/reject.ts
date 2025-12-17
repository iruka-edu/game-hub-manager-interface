import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';

/**
 * POST /api/games/reject
 * CTO/CEO rejects a game back to dev
 * Changes status: qc_passed -> qc_failed
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
    const isCTO = user.roles.includes('cto');
    const isCEO = user.roles.includes('ceo');
    const isAdmin = user.roles.includes('admin');
    if (!isCTO && !isCEO && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { gameId, note } = body;

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
    if (game.status !== 'qc_passed') {
      return new Response(JSON.stringify({ error: 'Game must be QC passed to reject' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update status back to qc_failed
    const updated = await gameRepo.updateStatus(gameId, 'qc_failed');

    // TODO: Save rejection note to game history/comments

    return new Response(JSON.stringify({ success: true, game: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Reject error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
