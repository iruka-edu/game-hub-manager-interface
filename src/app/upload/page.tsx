import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CloseButton } from '@/components/ui/CloseButton';
import { GameUploadForm } from '@/features/games/components/GameUploadForm';
import { UploadMetaForm } from '@/features/games/components/UploadMetaForm';
import { MetadataSummary } from '@/features/games/components/MetadataSummary';

interface Props {
  searchParams: Promise<{
    lop?: string;
    mon?: string;
    quyenSach?: string;
    lessonNo?: string;
    level?: string;
    game?: string;
    skill?: string | string[];
    theme?: string | string[];
    github?: string;
  }>;
}

export default async function UploadPage({ searchParams }: Props) {
  const params = await searchParams;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('iruka_session');

  if (!sessionCookie?.value) {
    redirect('/login?redirect=/upload');
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect('/login?redirect=/upload');
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findById(session.userId);

  if (!user) {
    redirect('/login');
  }

  // Role check - only dev and admin can upload
  const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
  const canUpload = hasRole('dev') || hasRole('admin');

  if (!canUpload) {
    redirect('/console?error=unauthorized');
  }

  // Parse metadata from URL params
  const skills = Array.isArray(params.skill) 
    ? params.skill 
    : params.skill 
      ? [params.skill]
      : [];
  const themes = Array.isArray(params.theme) 
    ? params.theme 
    : params.theme 
      ? [params.theme]
      : [];

  const meta = {
    lop: params.lop || '',
    mon: params.mon || '',
    quyenSach: params.quyenSach || '',
    lessonNo: params.lessonNo || '',
    level: params.level || '',
    game: params.game || '',
    skills,
    themes,
    github: params.github || '',
  };

  // Check if metadata is ready for upload - require essential fields including difficulty and lessonNo
  const metaReady =
    Boolean(meta.lop && meta.mon && meta.game && meta.github && meta.level && meta.lessonNo);

  const gameMeta = {
    grade: meta.lop,
    subject: meta.mon,
    lessonNo: meta.lessonNo,
    backendGameId: meta.game,
    level: meta.level,
    skills: meta.skills,
    themes: meta.themes,
    linkGithub: meta.github,
    quyenSach: meta.quyenSach,
  };

  const breadcrumbItems = [
    { label: 'Console', href: '/console' },
    { label: 'Upload Game' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <CloseButton href="/console" title="Đóng" />
        </header>

        {metaReady ? (
          <>
            <MetadataSummary meta={meta} />
            <GameUploadForm meta={gameMeta} />
          </>
        ) : (
          <UploadMetaForm values={meta} />
        )}
      </div>
    </div>
  );
}
