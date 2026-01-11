import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { GameRepository, type Game } from '@/models/Game';
import { GameVersionRepository, type GameVersion } from '@/models/GameVersion';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameTable } from '@/components/tables/GameTable';
import { GameFilters } from '@/components/filters/GameFilters';
import Link from 'next/link';

export interface GameWithVersion {
  game: Game;
  latestVersion: GameVersion | null;
  liveVersion: GameVersion | null;
}

interface Props {
  searchParams: Promise<{ status?: string; tab?: string }>;
}

async function getGamesWithVersions(userId: string): Promise<GameWithVersion[]> {
  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  const rawGames = await gameRepo.findByOwnerId(userId);

  const gamesWithVersions: GameWithVersion[] = await Promise.all(
    rawGames.map(async (game) => {
      const latestVersion = game.latestVersionId
        ? await versionRepo.findById(game.latestVersionId.toString())
        : await versionRepo.getLatestVersion(game._id.toString());
      const liveVersion = game.liveVersionId
        ? await versionRepo.findById(game.liveVersionId.toString())
        : null;
      return { game, latestVersion, liveVersion };
    })
  );

  return gamesWithVersions;
}

function groupGamesByStatus(games: GameWithVersion[]): Record<string, GameWithVersion[]> {
  return {
    draft: games.filter(g => g.latestVersion?.status === 'draft'),
    qc_failed: games.filter(g => g.latestVersion?.status === 'qc_failed'),
    uploaded: games.filter(g => g.latestVersion?.status === 'uploaded'),
    qc_processing: games.filter(g => g.latestVersion?.status === 'qc_processing'),
    qc_passed: games.filter(g => g.latestVersion?.status === 'qc_passed'),
    approved: games.filter(g => g.latestVersion?.status === 'approved'),
    published: games.filter(g => g.latestVersion?.status === 'published'),
  };
}

export default async function MyGamesPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('iruka_session');

  if (!sessionCookie?.value) {
    redirect('/login?redirect=/console/my-games');
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect('/login?redirect=/console/my-games');
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);

  if (!user) {
    redirect('/login?redirect=/console/my-games');
  }

  // Role check - only dev and admin
  const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
  if (!hasRole('dev') && !hasRole('admin')) {
    redirect('/console?error=unauthorized');
  }

  const statusFilter = params.status || '';
  const currentTab = params.tab || 'games';

  const gamesWithVersions = await getGamesWithVersions(session.userId);
  const groupedGames = groupGamesByStatus(gamesWithVersions);

  // Apply status filter
  const filteredGames = statusFilter
    ? gamesWithVersions.filter(g => g.latestVersion?.status === statusFilter)
    : gamesWithVersions;

  const statusLabels: Record<string, string> = {
    draft: 'Nháp',
    qc_failed: 'QC cần sửa',
    uploaded: 'Đang chờ QC',
    qc_processing: 'Đang QC',
    qc_passed: 'QC đạt - Chờ duyệt',
    approved: 'Đã duyệt - Chờ xuất bản',
    published: 'Đã xuất bản',
  };

  const breadcrumbItems = [
    { label: 'Console', href: '/console' },
    { label: 'Game của tôi' },
  ];

  const enableBulkActions = hasRole('dev') || hasRole('admin');

  return (
    <div className="p-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Game của tôi</h1>
          <p className="text-slate-500 mt-1">Quản lý các game bạn đang phát triển</p>
        </div>
        <Link
          href="/upload"
          className="btn-primary flex items-center gap-2 min-h-[40px] px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo game mới
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
        <Link
          href="/console/my-games?tab=games"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            currentTab === 'games'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Danh sách game
        </Link>
        {hasRole('admin') && (
          <Link
            href="/console/my-games?tab=gcs"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'gcs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            Quản lý GCS
          </Link>
        )}
      </div>

      {/* Games Tab Content */}
      {currentTab === 'games' && (
        <>
          <GameFilters
            statusFilter={statusFilter}
            groupedGames={groupedGames}
            totalCount={gamesWithVersions.length}
          />

          {filteredGames.length > 0 ? (
            <GameTable games={filteredGames} showBulkActions={enableBulkActions} />
          ) : (
            <EmptyState
              title={
                statusFilter
                  ? `Không có game nào ở trạng thái "${statusLabels[statusFilter]}"`
                  : 'Bạn chưa có game nào'
              }
              description={
                statusFilter
                  ? 'Thử chọn bộ lọc khác hoặc tạo game mới'
                  : 'Bắt đầu bằng cách tạo game đầu tiên của bạn'
              }
              icon="game"
              action={statusFilter ? undefined : { label: 'Tạo game đầu tiên', href: '/upload' }}
            />
          )}
        </>
      )}

      {/* GCS Management Tab - placeholder for now */}
      {currentTab === 'gcs' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-slate-500">GCS Management will be migrated in a later task.</p>
        </div>
      )}
    </div>
  );
}
