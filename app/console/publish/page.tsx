import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookies } from '@/lib/auth';
import { GameRepository } from '@/src/models/Game';
import { GameVersionRepository } from '@/src/models/GameVersion';
import { UserRepository } from '@/src/models/User';
import { PublishActions } from '@/components/publish/PublishActions';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function PublishPage({ searchParams }: PageProps) {
  const user = await getUserFromCookies();

  if (!user) {
    redirect('/login?redirect=/console/publish');
  }

  const params = await searchParams;
  const statusFilter = params.status || 'approved';

  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  const userRepo = await UserRepository.getInstance();
  const allGames = await gameRepo.findAll();

  interface GameWithStatus {
    _id: string;
    gameId: string;
    title?: string;
    versionStatus?: string;
    liveVersionId?: string;
    ownerName: string;
    rolloutPercentage: number;
    disabled?: boolean;
  }

  const gamesWithStatus: GameWithStatus[] = await Promise.all(
    allGames.map(async (game) => {
      const owner = await userRepo.findById(game.ownerId);
      let versionStatus: string | undefined;

      if (game.liveVersionId) {
        const version = await versionRepo.findById(game.liveVersionId.toString());
        if (version) versionStatus = version.status;
      }
      if (!versionStatus && game.latestVersionId) {
        const version = await versionRepo.findById(game.latestVersionId.toString());
        if (version) versionStatus = version.status;
      }

      return {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
        versionStatus,
        liveVersionId: game.liveVersionId?.toString(),
        ownerName: owner?.name || owner?.email || 'Unknown',
        rolloutPercentage: game.rolloutPercentage ?? 100,
        disabled: game.disabled,
      };
    })
  );

  let filteredGames: GameWithStatus[] = [];
  if (statusFilter === 'approved') {
    filteredGames = gamesWithStatus.filter((g) => g.versionStatus === 'approved');
  } else if (statusFilter === 'published') {
    filteredGames = gamesWithStatus.filter((g) => g.versionStatus === 'published');
  } else if (statusFilter === 'archived') {
    filteredGames = gamesWithStatus.filter((g) => g.versionStatus === 'archived');
  }

  const approvedCount = gamesWithStatus.filter((g) => g.versionStatus === 'approved').length;
  const publishedCount = gamesWithStatus.filter((g) => g.versionStatus === 'published').length;
  const archivedCount = gamesWithStatus.filter((g) => g.versionStatus === 'archived').length;

  return (
    <div className="p-8">
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/console" className="text-slate-500 hover:text-slate-900 transition-colors">
          Console
        </Link>
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-medium">Quản lý xuất bản</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý xuất bản</h1>
        <p className="text-slate-500 mt-1">Xuất bản game ra ngoài cho học sinh sử dụng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/console/publish?status=approved"
          className={`bg-white rounded-xl p-6 border-2 transition-all ${
            statusFilter === 'approved' ? 'border-emerald-500' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <p className="text-sm text-slate-500">Chờ xuất bản</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
        </Link>
        <Link
          href="/console/publish?status=published"
          className={`bg-white rounded-xl p-6 border-2 transition-all ${
            statusFilter === 'published' ? 'border-green-500' : 'border-slate-200 hover:border-green-300'
          }`}
        >
          <p className="text-sm text-slate-500">Đang xuất bản</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{publishedCount}</p>
        </Link>
        <Link
          href="/console/publish?status=archived"
          className={`bg-white rounded-xl p-6 border-2 transition-all ${
            statusFilter === 'archived' ? 'border-gray-500' : 'border-slate-200 hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-slate-500">Đã lưu trữ</p>
          <p className="text-3xl font-bold text-gray-600 mt-1">{archivedCount}</p>
        </Link>
      </div>

      {filteredGames.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Game</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Rollout</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Dev</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGames.map((game) => (
                <tr key={game._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/console/games/${game._id}`} className="block">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 hover:text-indigo-600">
                          {game.title || game.gameId}
                        </p>
                        {game.disabled && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{game.gameId}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{game.rolloutPercentage}%</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{game.ownerName}</td>
                  <td className="px-6 py-4">
                    <PublishActions
                      gameId={game._id}
                      gameTitle={game.title || game.gameId}
                      versionStatus={game.versionStatus}
                      liveVersionId={game.liveVersionId}
                      rolloutPercentage={game.rolloutPercentage}
                      disabled={game.disabled}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            {statusFilter === 'approved'
              ? 'Không có game nào chờ xuất bản'
              : statusFilter === 'published'
                ? 'Chưa có game nào được xuất bản'
                : 'Không có game nào đã lưu trữ'}
          </h3>
        </div>
      )}
    </div>
  );
}
