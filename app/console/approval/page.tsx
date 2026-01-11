import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookies } from '@/lib/auth';
import { GameRepository } from '@/src/models/Game';
import { GameVersionRepository } from '@/src/models/GameVersion';
import { UserRepository } from '@/src/models/User';
import { StatusChip } from '@/components/ui/StatusChip';
import { ApprovalActions } from '@/components/approval/ApprovalActions';

export default async function ApprovalPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect('/login?redirect=/console/approval');
  }

  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  const userRepo = await UserRepository.getInstance();

  const allGames = await gameRepo.findAll();
  const gamesWithQcPassedLatest = [];

  for (const game of allGames) {
    if (!game.latestVersionId) continue;
    const latestVersion = await versionRepo.findById(game.latestVersionId.toString());
    if (latestVersion && latestVersion.status === 'qc_passed') {
      gamesWithQcPassedLatest.push(game);
    }
  }

  let approvedCount = 0;
  let publishedThisMonth = 0;
  const now = new Date();

  for (const game of allGames) {
    if (!game.latestVersionId) continue;
    const latestVersion = await versionRepo.findById(game.latestVersionId.toString());
    if (latestVersion) {
      if (latestVersion.status === 'approved') approvedCount++;
      if (
        latestVersion.status === 'published' &&
        game.updatedAt.getMonth() === now.getMonth() &&
        game.updatedAt.getFullYear() === now.getFullYear()
      ) {
        publishedThisMonth++;
      }
    }
  }

  const gamesWithOwner = await Promise.all(
    gamesWithQcPassedLatest.map(async (game) => {
      const owner = await userRepo.findById(game.ownerId);
      return {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
        ownerName: owner?.name || owner?.email || 'Unknown',
        updatedAt: game.updatedAt.toISOString(),
      };
    })
  );

  return (
    <div className="p-8">
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/console" className="text-slate-500 hover:text-slate-900 transition-colors">
          Console
        </Link>
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-medium">Chờ duyệt</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Game chờ duyệt</h1>
        <p className="text-slate-500 mt-1">Các game đã qua QC và đang chờ phê duyệt để xuất bản</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <p className="text-sm text-slate-500">QC đạt - Chờ duyệt</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{gamesWithOwner.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <p className="text-sm text-slate-500">Đã duyệt (chờ publish)</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <p className="text-sm text-slate-500">Xuất bản tháng này</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{publishedThisMonth}</p>
        </div>
      </div>

      {gamesWithOwner.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Game</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Dev phụ trách</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Kết quả QC</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Ngày QC</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gamesWithOwner.map((game) => (
                <tr key={game._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/console/games/${game._id}`} className="block">
                      <p className="font-medium text-slate-900 hover:text-indigo-600">
                        {game.title || game.gameId}
                      </p>
                      <p className="text-sm text-slate-500">{game.gameId}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{game.ownerName}</td>
                  <td className="px-6 py-4">
                    <StatusChip status="qc_passed" size="sm" />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(game.updatedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4">
                    <ApprovalActions gameId={game._id} gameTitle={game.title || game.gameId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Không có game nào chờ duyệt</h3>
          <p className="text-slate-500">Tất cả game đã được xử lý.</p>
        </div>
      )}
    </div>
  );
}
