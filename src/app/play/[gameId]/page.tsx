import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { hasPermissionString } from '@/lib/auth-rbac';
import { constructFileUrl } from '@/lib/storage-path';
import { GamePlayer } from './GamePlayer';

interface Props {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function PlayGamePage({ params }: Props) {
  const { gameId } = await params;

  // Auth check
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('iruka_session');
  
  if (!sessionCookie?.value) {
    redirect('/login?redirect=/play/' + gameId);
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect('/login?redirect=/play/' + gameId);
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);
  
  if (!user) {
    redirect('/login');
  }

  // Permission check - only users with games:play permission can play
  if (!hasPermissionString(user, 'games:play')) {
    redirect('/console?error=unauthorized');
  }

  // Get game and latest version
  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  
  const game = await gameRepo.findById(gameId);
  
  if (!game) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Game không tồn tại</h1>
          <p className="text-slate-500 mb-4">Không tìm thấy game với ID: {gameId}</p>
          <a 
            href="/console" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Quay lại Console
          </a>
        </div>
      </div>
    );
  }

  // Get latest version or live version
  let version = null;
  let gameUrl = '';

  if (game.liveVersionId) {
    // Use live version if available
    version = await versionRepo.findById(game.liveVersionId.toString());
  } else if (game.latestVersionId) {
    // Fallback to latest version
    version = await versionRepo.findById(game.latestVersionId.toString());
  }

  if (version && version.storagePath) {
    // Construct game URL from GCS using utility function
    const CDN_BASE = `https://storage.googleapis.com/${process.env.GCLOUD_BUCKET_NAME || 'iruka-edu-mini-game'}`;
    gameUrl = constructFileUrl(version.storagePath, version.entryFile || 'index.html', CDN_BASE);
  }

  if (!gameUrl) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Game chưa sẵn sàng</h1>
          <p className="text-slate-500 mb-4">Game "{game.title}" chưa có phiên bản để chơi.</p>
          <a 
            href="/console" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Quay lại Console
          </a>
        </div>
      </div>
    );
  }

  // Serialize objects to plain JavaScript objects for Client Component
  const serializedGame = {
    _id: game._id.toString(),
    gameId: game.gameId,
    title: game.title,
    description: game.description,
    thumbnailDesktop: game.thumbnailDesktop,
    thumbnailMobile: game.thumbnailMobile,
    ownerId: game.ownerId,
    teamId: game.teamId?.toString(),
    latestVersionId: game.latestVersionId?.toString(),
    liveVersionId: game.liveVersionId?.toString(),
    subject: game.subject,
    grade: game.grade,
    unit: game.unit,
    gameType: game.gameType,
    priority: game.priority,
    tags: game.tags,
    lesson: Array.isArray(game.lesson) ? game.lesson[0] : game.lesson,
    level: game.level,
    skills: game.skills,
    themes: game.themes,
    linkGithub: game.linkGithub,
    disabled: game.disabled,
    rolloutPercentage: game.rolloutPercentage,
    publishedAt: game.publishedAt?.toISOString(),
    isDeleted: game.isDeleted,
    createdAt: game.createdAt?.toISOString(),
    updatedAt: game.updatedAt?.toISOString(),
  };

  const serializedVersion = version ? {
    _id: version._id.toString(),
    gameId: version.gameId?.toString(),
    version: version.version,
    storagePath: version.storagePath,
    entryFile: version.entryFile,
    buildSize: version.buildSize,
    status: version.status,
    isDeleted: version.isDeleted,
    selfQAChecklist: version.selfQAChecklist,
    releaseNote: version.releaseNote,
    submittedBy: version.submittedBy?.toString(),
    submittedAt: version.submittedAt?.toISOString(),
    createdAt: version.createdAt?.toISOString(),
    updatedAt: version.updatedAt?.toISOString(),
  } : null;

  return <GamePlayer game={serializedGame} version={serializedVersion} gameUrl={gameUrl} gameId={gameId} />;
}