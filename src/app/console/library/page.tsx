import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { hasPermissionString } from '@/lib/auth-rbac';
import { serializeGame, type Game } from '@/models/Game';
import { serializeGameVersion, type GameVersion } from '@/models/GameVersion';
import { GameLibraryClient } from './GameLibraryClient';

interface SerializedGame extends Record<string, unknown> {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  ownerId: string;
  subject?: string;
  grade?: string;
  gameType?: string;
  disabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SerializedGameVersion extends Record<string, unknown> {
  _id: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface GameWithVersion {
  game: SerializedGame;
  latestVersion?: SerializedGameVersion;
  owner?: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
  };
}

export default async function GameLibraryPage() {
  // Auth check
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('iruka_session');
  
  if (!sessionCookie?.value) {
    redirect('/login');
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect('/login');
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);
  
  if (!user) {
    redirect('/login');
  }

  // Permission check
  if (!hasPermissionString(user, 'games:view')) {
    redirect('/console');
  }

  // Fetch all games with their latest versions
  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  
  const games = await gameRepo.findAll();
  
  // Get latest versions and owner info for each game
  const gamesWithVersions: GameWithVersion[] = await Promise.all(
    games.map(async (game: Game) => {
      const serializedGame = serializeGame(game) as SerializedGame;
      
      let latestVersion: SerializedGameVersion | undefined;
      if (game.latestVersionId) {
        const version = await versionRepo.findById(game.latestVersionId.toString());
        if (version) {
          latestVersion = serializeGameVersion(version) as SerializedGameVersion;
        }
      }

      // Get owner info
      const owner = await gameRepo.getUserById(game.ownerId);

      return {
        game: serializedGame,
        latestVersion,
        owner: owner ? {
          _id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          username: owner.username,
        } : undefined,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thư viện Game</h1>
          <p className="text-slate-500 mt-1">
            Tất cả game trong hệ thống ({gamesWithVersions.length} game)
          </p>
        </div>
      </div>

      {/* Games List */}
      <GameLibraryClient 
        initialGames={gamesWithVersions}
        currentUserId={session.userId}
        userRoles={user.roles || []}
      />
    </div>
  );
}