import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookies } from '@/lib/auth';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { QCReportRepository } from '@/models/QcReport';
import { UserRepository } from '@/models/User';
import { StatusChip } from '@/components/ui/StatusChip';
import { QCInboxClient } from './QCInboxClient';

export default async function QCInboxPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect('/login?redirect=/console/qc-inbox');
  }

  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  const qcReportRepo = await QCReportRepository.getInstance();
  const userRepo = await UserRepository.getInstance();

  // Get uploaded versions and published games for QC review
  const uploadedVersions = await versionRepo.findByStatus('uploaded');
  const publishedVersions = await versionRepo.findByStatus('published');

  const processVersions = async (versions: any[], status: string) => {
    return Promise.all(
      versions.map(async (version) => {
        const game = await gameRepo.findById(version.gameId.toString());
        if (!game) return null;

        const owner = await userRepo.findById(game.ownerId);
        const qcAttempts = await qcReportRepo.countByGameId(game._id.toString());
        const isRetest = qcAttempts > 0;

        return {
          _id: game._id.toString(),
          gameId: game.gameId,
          title: game.title,
          description: game.description,
          subject: game.subject,
          grade: game.grade,
          gameType: game.gameType,
          thumbnailDesktop: game.thumbnailDesktop,
          thumbnailMobile: game.thumbnailMobile,
          version: version.version,
          versionId: version._id.toString(),
          status: version.status,
          submittedAt: version.submittedAt || version.updatedAt,
          publishedAt: version.publishedAt,
          ownerName: owner?.name || owner?.email || 'Unknown',
          qcAttempts,
          isRetest,
          buildSize: version.buildSize,
          selfQAChecklist: version.selfQAChecklist,
        };
      })
    );
  };

  const pendingGames = (await processVersions(uploadedVersions, 'uploaded'))
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => {
      if (a.isRetest && !b.isRetest) return -1;
      if (!a.isRetest && b.isRetest) return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  const publishedGames = (await processVersions(publishedVersions, 'published'))
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => new Date(b.publishedAt || b.submittedAt).getTime() - new Date(a.publishedAt || a.submittedAt).getTime());

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile-optimized header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <nav className="flex items-center gap-2 text-sm mb-2">
            <Link href="/console" className="text-slate-500 hover:text-slate-900 transition-colors">
              Console
            </Link>
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-900 font-medium">QC Inbox</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">QC Inbox</h1>
              <p className="text-slate-500 text-sm">Kiểm tra chất lượng game</p>
            </div>
          </div>
        </div>
      </div>

      <QCInboxClient 
        pendingGames={pendingGames}
        publishedGames={publishedGames}
        userRoles={user.roles || []}
      />
    </div>
  );
}
