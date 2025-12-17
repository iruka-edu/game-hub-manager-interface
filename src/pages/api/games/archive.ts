import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';

/**
 * POST /api/games/archive
 * Admin archives a published game
 * Changes status: published -> archived
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
      return new Response(JSON.stringify({ error: 'Forbidden: Only admin can archive' }), {
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
    if (game.status !== 'published') {
      return new Response(JSON.stringify({ error: 'Only published games can be archived' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update status
    const updated = await gameRepo.updateStatus(gameId, 'archived');

    return new Response(JSON.stringify({ success: true, game: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Archive error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
