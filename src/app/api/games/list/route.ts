import { NextRequest, NextResponse } from 'next/server';
import { RegistryManager } from '@/lib/registry';
import { GameRepository, type Game } from '@/models/Game';
import { GameVersionRepository, type VersionStatus } from '@/models/GameVersion';
import type { User } from '@/models/User';
import { getUserFromHeaders } from '@/lib/auth';

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
 * Migrated from: src/pages/api/games/list.ts
 */
async function filterGamesByRole(
  games: GameWithVersion[], 
  user: User
): Promise<GameWithVersion[]> {
  const roles = user.roles;
  
  if (roles.includes('admin')) {
    return games;
  }
  
  if (roles.includes('cto') || roles.includes('ceo')) {
    return games.filter(game => game.latestVersion?.status === 'qc_passed');
  }
  
  if (roles.includes('qc')) {
    return games.filter(game => game.latestVersion?.status === 'uploaded');
  }
  
  if (roles.includes('dev')) {
    const userId = user._id.toString();
    return games.filter(game => game.ownerId === userId);
  }
  
  return [];
}

/**
 * GET /api/games/list
 * List games with role-based filtering
 * Migrated from: src/pages/api/games/list.ts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request.headers);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') || undefined;
    const ownerIdFilter = searchParams.get('ownerId') || undefined;
    const subjectFilter = searchParams.get('subject') || undefined;
    const gradeFilter = searchParams.get('grade') || undefined;
    const isDeletedFilter = searchParams.get('isDeleted');
    
    const includeDeleted = isDeletedFilter === 'true';

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    
    let allGames: Game[];
    if (includeDeleted) {
      allGames = await gameRepo.findDeleted();
      const nonDeleted = await gameRepo.findAll();
      allGames = [...nonDeleted, ...allGames];
    } else {
      allGames = await gameRepo.findAll();
    }
    
    if (statusFilter) {
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
    
    const gamesWithVersions: GameWithVersion[] = await Promise.all(
      allGames.map(async (game) => {
        const gameWithVersion: GameWithVersion = { ...game };
        
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
    
    const filteredGames = await filterGamesByRole(gamesWithVersions, user);
    
    return NextResponse.json({ games: filteredGames }, { status: 200 });
  } catch (error: unknown) {
    console.error('List games error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch games';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/games/list
 * Legacy endpoint for backward compatibility - returns registry data
 * Migrated from: src/pages/api/games/list.ts
 */
export async function POST() {
  try {
    const registry = await RegistryManager.get();
    return NextResponse.json(registry, { status: 200 });
  } catch (error: any) {
    console.error('List games error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
