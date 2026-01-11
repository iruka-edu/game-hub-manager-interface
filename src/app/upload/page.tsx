import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CloseButton } from '@/components/ui/CloseButton';
import { GameUploadForm } from '@/features/games/components/GameUploadForm';

interface Props {
  searchParams: Promise<{
    lop?: string;
    mon?: string;
    quyenSach?: string;
    lesson?: string;
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
  const skills = Array.isArray(params.skill) ? params.skill : params.skill ? [params.skill] : [];
  const themes = Array.isArray(params.theme) ? params.theme : params.theme ? [params.theme] : [];

  const meta = {
    lop: params.lop || '',
    mon: params.mon || '',
    quyenSach: params.quyenSach || '',
    lesson: params.lesson || '',
    level: params.level || '',
    game: params.game || '',
    skills,
    themes,
    github: params.github || '',
  };

  // Check if metadata is ready for upload
  const metaReady =
    Boolean(meta.lop && meta.mon && meta.quyenSach && meta.lesson && meta.game && meta.level && meta.github);
    // Removed skills and themes requirement to make them optional

  const gameMeta = {
    grade: meta.lop,
    subject: meta.mon,
    lesson: meta.lesson ? [meta.lesson] : [],
    backendGameId: meta.game,
    level: meta.level,
    skills: meta.skills,
    themes: meta.themes,
    linkGithub: meta.github,
    quyenSach: meta.quyenSach,
  };

  const breadcrumbItems = [
    { label: 'Console', href: '/console' },
    { label: 'Upload' },
  ];

  return (
    <div className="w-full px-6 py-4">
      {/* Header */}
      <header className="flex items-center gap-2 mb-4">
        <Breadcrumb items={breadcrumbItems} />
        <CloseButton href="/console" title="Đóng" />
      </header>

      {metaReady ? (
        <>
          {/* Metadata Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-600">
                <span className="font-black text-slate-900">Metadata:</span>{' '}
                {meta.lop} • {meta.mon} • {meta.quyenSach} • {meta.lesson} • {meta.game} • {meta.level} •{' '}
                {meta.skills.join(', ')} • {meta.themes.join(', ')}{' '}
                • <span className="text-blue-600">{meta.github}</span>
              </div>
              <a href="/upload" className="text-xs font-black text-slate-600 hover:underline">
                Sửa
              </a>
            </div>
          </div>

          <GameUploadForm meta={gameMeta} />
        </>
      ) : (
        <UploadMetaForm values={meta} />
      )}

      {/* Help Section */}
      <details className="mt-6 group">
        <summary className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Hướng dẫn
          <svg
            className="w-3 h-3 group-open:rotate-180 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-2">
          <p>Kiểm tra build trước khi upload:</p>
          <code className="block bg-slate-800 text-emerald-400 p-2 rounded text-[11px]">
            pnpm iruka-game:validate ./dist
          </code>
        </div>
      </details>
    </div>
  );
}

// Metadata form component (inline for simplicity)
function UploadMetaForm({ values }: { values: any }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Thông tin Game</h2>
      <p className="text-sm text-slate-500 mb-6">
        Điền đầy đủ thông tin metadata trước khi upload file game.
      </p>

      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lớp</label>
            <select
              name="lop"
              defaultValue={values.lop}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Chọn lớp</option>
              <option value="1">Lớp 1</option>
              <option value="2">Lớp 2</option>
              <option value="3">Lớp 3</option>
              <option value="4">Lớp 4</option>
              <option value="5">Lớp 5</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
            <select
              name="mon"
              defaultValue={values.mon}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Chọn môn</option>
              <option value="math">Toán</option>
              <option value="vietnamese">Tiếng Việt</option>
              <option value="english">Tiếng Anh</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quyển sách</label>
            <input
              type="text"
              name="quyenSach"
              defaultValue={values.quyenSach}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="VD: Tập 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bài học</label>
            <input
              type="text"
              name="lesson"
              defaultValue={values.lesson}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="VD: Bài 1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Game ID</label>
            <input
              type="text"
              name="game"
              defaultValue={values.game}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="VD: com.iruka.math-game"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <input
              type="text"
              name="level"
              defaultValue={values.level}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="VD: easy"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Link GitHub</label>
          <input
            type="text"
            name="github"
            defaultValue={values.github}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="https://github.com/..."
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Tiếp tục
          </button>
        </div>
      </form>
    </div>
  );
}
