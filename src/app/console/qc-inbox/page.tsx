import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookies } from '@/lib/auth';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { QCReportRepository } from '@/models/QcReport';
import { UserRepository } from '@/models/User';
import { StatusChip } from '@/components/ui/StatusChip';

export default async function QCInboxPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect('/login?redirect=/console/qc-inbox');
  }

  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  const qcReportRepo = await QCReportRepository.getInstance();
  const userRepo = await UserRepository.getInstance();

  const uploadedVersions = await versionRepo.findByStatus('uploaded');

  const gamesWithOwner = await Promise.all(
    uploadedVersions.map(async (version) => {
      const game = await gameRepo.findById(version.gameId.toString());
      if (!game) return null;

      const owner = await userRepo.findById(game.ownerId);
      const qcAttempts = await qcReportRepo.countByGameId(game._id.toString());
      const isRetest = qcAttempts > 0;

      return {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
        version: version.version,
        versionId: version._id.toString(),
        submittedAt: version.submittedAt || version.updatedAt,
        ownerName: owner?.name || owner?.email || 'Unknown',
        qcAttempts,
        isRetest,
      };
    })
  );

  const games = gamesWithOwner
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => {
      if (a.isRetest && !b.isRetest) return -1;
      if (!a.isRetest && b.isRetest) return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  return (
    <div className="p-8">
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/console" className="text-slate-500 hover:text-slate-900 transition-colors">
          Console
        </Link>
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-medium">QC Inbox</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">QC Inbox</h1>
        <p className="text-slate-500 mt-1">Các game đang chờ bạn kiểm tra chất lượng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <p className="text-sm text-slate-500">Đang chờ QC</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{games.length}</p>
        </div>
      </div>

      {games.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Game</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Version</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Dev phụ trách</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Ngày gửi</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Lần QC</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {games.map((game) => (
                <tr
                  key={game._id}
                  className={`hover:bg-slate-50 transition-colors ${game.isRetest ? 'bg-amber-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <Link href={`/console/games/${game._id}/review?versionId=${game.versionId}`} className="block">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 hover:text-indigo-600">
                          {game.title || game.gameId}
                        </p>
                        {game.isRetest && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                            Re-test
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{game.gameId}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-sm font-mono bg-slate-100 text-slate-700 rounded">
                      v{game.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{game.ownerName}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(game.submittedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {game.qcAttempts > 0 ? (
                      <span className="text-amber-600 font-medium">Lần {game.qcAttempts + 1}</span>
                    ) : (
                      <span className="text-green-600">Lần đầu</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/console/games/${game._id}/review?versionId=${game.versionId}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Mở review
                      </Link>
                    </div>
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
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Không có game nào đang chờ QC</h3>
          <p className="text-slate-500">Bạn có thể xem lại các game đã QC ở thư viện game.</p>
          <Link href="/console/library" className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
            Xem thư viện game →
          </Link>
        </div>
      )}
    </div>
  );
}
