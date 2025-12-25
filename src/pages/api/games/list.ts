import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';
import { GameRepository, type Game } from '../../../models/Game';
import { GameVersionRepository, type VersionStatus } from '../../../models/GameVersion';
import type { User } from '../../../models/User';

/**
 * Game with version info for API response
 */
interface GameWithVersion extends Game {
  latestVersion?: {
    _id: string;
    version: string;
    status: VersionStatus;
    submittedAt?: string;
  };
  liveVersion?: {
    _id: string;
    version: string;
  };
}

/**
 * Filter games based on user role and version status
 * - dev: only games where ownerId matches user's id
 * - qc: only games with latest version status "uploaded"
 * - cto/ceo: only games with latest version status "qc_passed"
 * - admin: all games
 */
async function filterGamesByRole(
  games: GameWithVersion[], 
  user: User
): Promise<GameWithVersion[]> {
  const roles = user.roles;
  
  // Admin sees all games
  if (roles.includes('admin')) {
    return games;
  }
  
  // CTO/CEO sees games awaiting approval
  if (roles.includes('cto') || roles.includes('ceo')) {
    return games.filter(game => game.latestVersion?.status === 'qc_passed');
  }
  
  // QC sees games ready for review
  if (roles.includes('qc')) {
    return games.filter(game => game.latestVersion?.status === 'uploaded');
  }
  
  // Dev sees only their own games
  if (roles.includes('dev')) {
    const userId = user._id.toString();
    return games.filter(game => game.ownerId === userId);
  }
  
  // No matching role, return empty
  return [];
}

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Get user from middleware (attached to locals)
    const user = locals.user as User | undefined;
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters for filtering
    const searchParams = url.searchParams;
    const statusFilter = searchParams.get('status') || undefined;
    const ownerIdFilter = searchParams.get('ownerId') || undefined;
    const subjectFilter = searchParams.get('subject') || undefined;
    const gradeFilter = searchParams.get('grade') || undefined;
    const isDeletedFilter = searchParams.get('isDeleted');
    
    // Default: exclude deleted games unless explicitly requested
    const includeDeleted = isDeletedFilter === 'true';

    // Get games from MongoDB
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    
    // Fetch games based on deletion filter
    let allGames: Game[];
    if (includeDeleted) {
      // Get all games including deleted ones
      allGames = await gameRepo.findDeleted();
      const nonDeleted = await gameRepo.findAll();
      allGames = [...nonDeleted, ...allGames];
    } else {
      // Default: only non-deleted games
      allGames = await gameRepo.findAll();
    }
    
    // Apply filters (AND logic - all conditions must be satisfied)
    if (statusFilter) {
      // Filter by game status (note: status is deprecated, but kept for compatibility)
      allGames = allGames.filter(game => game.status === statusFilter);
    }
    
    if (ownerIdFilter) {
      allGames = allGames.filter(game => game.ownerId === ownerIdFilter);
    }
    
    if (subjectFilter) {
      allGames = allGames.filter(game => game.subject === subjectFilter);
    }
    
    if (gradeFilter) {
      allGames = allGames.filter(game => game.grade === gradeFilter);
    }
    
    // Enrich games with version info
    const gamesWithVersions: GameWithVersion[] = await Promise.all(
      allGames.map(async (game) => {
        const gameWithVersion: GameWithVersion = { ...game };
        
        // Get latest version info
        if (game.latestVersionId) {
          const latestVersion = await versionRepo.findById(game.latestVersionId.toString());
          if (latestVersion) {
            gameWithVersion.latestVersion = {
              _id: latestVersion._id.toString(),
              version: latestVersion.version,
              status: latestVersion.status,
              submittedAt: latestVersion.submittedAt?.toISOString(),
            };
          }
        }
        
        // Get live version info
        if (game.liveVersionId) {
          const liveVersion = await versionRepo.findById(game.liveVersionId.toString());
          if (liveVersion) {
            gameWithVersion.liveVersion = {
              _id: liveVersion._id.toString(),
              version: liveVersion.version,
            };
          }
        }
        
        return gameWithVersion;
      })
    );
    
    // Filter based on user role
    const filteredGames = await filterGamesByRole(gamesWithVersions, user);
    
    return new Response(JSON.stringify({ games: filteredGames }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('List games error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch games';
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
