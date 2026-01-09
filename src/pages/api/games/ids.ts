import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { getUserFromRequest } from '../../../lib/session';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Auth check
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Role check - only admin
    const hasRole = (role: string) => user?.roles?.includes(role as any) ?? false;
    if (!hasRole('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all game IDs from database
    const gameRepo = await GameRepository.getInstance();
    const games = await gameRepo.findAll();
    
    const gameIds = games.map(game => game.gameId).filter(Boolean);

    return new Response(JSON.stringify({ 
      gameIds,
      total: gameIds.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to get game IDs:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get game IDs',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};