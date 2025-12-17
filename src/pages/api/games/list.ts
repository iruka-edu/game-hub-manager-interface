import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';
import { GameRepository, type Game } from '../../../models/Game';
import type { User, Role } from '../../../models/User';

/**
 * Filter games based on user role
 * - dev: only games where ownerId matches user's id
 * - qc: only games with status "uploaded"
 * - cto/ceo: only games with status "qc_passed"
 * - admin: all games
 */
function filterGamesByRole(games: Game[], user: User): Game[] {
  // Check user's highest priority role
  const roles = user.roles;
  
  // Admin sees all games
  if (roles.includes('admin')) {
    return games;
  }
  
  // CTO/CEO sees games awaiting approval
  if (roles.includes('cto') || roles.includes('ceo')) {
    return games.filter(game => game.status === 'qc_passed');
  }
  
  // QC sees games ready for review
  if (roles.includes('qc')) {
    return games.filter(game => game.status === 'uploaded');
  }
  
  // Dev sees only their own games
  if (roles.includes('dev')) {
    const userId = user._id.toString();
    return games.filter(game => game.ownerId === userId);
  }
  
  // No matching role, return empty
  return [];
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get user from middleware (attached to locals)
    const user = locals.user as User | undefined;
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get games from MongoDB
    const gameRepo = await GameRepository.getInstance();
    const allGames = await gameRepo.findAll();
    
    // Filter based on user role
    const filteredGames = filterGamesByRole(allGames, user);
    
    return new Response(JSON.stringify({ games: filteredGames }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('List games error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch games' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Legacy endpoint for backward compatibility
 * Returns registry data without role filtering
 */
export const POST: APIRoute = async () => {
  try {
    const registry = await RegistryManager.get();
    
    return new Response(JSON.stringify(registry), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('List games error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch games' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
