import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { GameEditForm } from '@/features/games/components/GameEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GameEditPage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('iruka_session');

  if (!sessionCookie?.value) {
    redirect(`/login?redirect=/console/games/${id}/edit`);
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect(`/login?redirect=/console/games/${id}/edit`);
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);

  if (!user) {
    redirect('/login');
  }

  // Get game
  const gameRepo = await GameRepository.getInstance();
  const versionRepo = await GameVersionRepository.getInstance();
  const game = await gameRepo.findById(id);

  if (!game) {
    notFound();
  }

  // Get latest version to check status
  const latestVersion = game.latestVersionId
    ? await versionRepo.findById(game.latestVersionId.toString())
    : null;

  // Check ownership
  const isOwner = game.ownerId === user._id.toString();
  const isAdmin = user.roles.includes('admin');

  if (!isOwner && !isAdmin) {
    redirect('/403');
  }

  // Check status - only draft or qc_failed can be edited
  const latestVersionStatus = latestVersion?.status || 'draft';
  const canEdit = ['draft', 'qc_failed'].includes(latestVersionStatus);

  if (!canEdit) {
    redirect(`/console/games/${id}?error=cannot_edit&status=${latestVersionStatus}`);
  }

  // Serialize game data for client component
  const gameData = {
    _id: game._id.toString(),
    gameId: game.gameId,
    title: game.title || '',
    description: game.description || '',
    subject: game.subject || '',
    grade: game.grade || '',
    unit: game.unit || '',
    gameType: game.gameType || '',
    lesson: Array.isArray(game.lesson) ? game.lesson : (game.lesson ? [game.lesson] : []),
    level: game.level || '',
    skills: game.skills || [],
    themes: game.themes || [],
    linkGithub: game.linkGithub || '',
    quyenSach: game.quyenSach || '',
    thumbnailDesktop: game.thumbnailDesktop || '',
    thumbnailMobile: game.thumbnailMobile || '',
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <a
          href={`/console/games/${id}`}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-2 inline-block"
        >
          ← Quay lại chi tiết game
        </a>
        <h1 className="text-2xl font-bold text-slate-900">Sửa thông tin game</h1>
        <p className="text-slate-500 mt-1">Game ID: {game.gameId}</p>
      </div>

      <GameEditForm game={gameData} />
    </div>
  );
}
