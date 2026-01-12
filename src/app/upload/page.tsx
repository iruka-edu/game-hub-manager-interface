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
    lesson: params.lesson || '',
    level: params.level || '',
    game: params.game || '',
    skills,
    themes,
    github: params.github || '',
  };

  // Check if metadata is ready for upload - only require essential fields
  const metaReady =
    Boolean(meta.lop && meta.mon && meta.game && meta.github);
    // Only require: grade, subject, gameId, github. Others are optional.

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
                Lớp {meta.lop} • {getSubjectName(meta.mon)} • {meta.game}{' '}
                {meta.quyenSach && `• ${meta.quyenSach}`}
                {meta.lesson && ` • ${meta.lesson}`}
                {meta.level && ` • ${getLevelName(meta.level)}`}
                {meta.skills.length > 0 && ` • Kỹ năng: ${meta.skills.map(s => getSkillName(s)).join(', ')}`}
                {meta.themes.length > 0 && ` • Chủ đề: ${meta.themes.map(t => getThemeName(t)).join(', ')}`}
                {' • '}<span className="text-blue-600">{meta.github}</span>
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
    </div>
  );
}

// Helper functions to convert IDs to names
function getSubjectName(subject: string): string {
  const subjects: Record<string, string> = {
    'math': 'Toán học',
    'vietnamese': 'Tiếng Việt',
    'english': 'Tiếng Anh',
    'science': 'Khoa học',
    'history': 'Lịch sử',
    'geography': 'Địa lý',
  };
  return subjects[subject] || subject;
}

function getLevelName(level: string): string {
  const levels: Record<string, string> = {
    '1': 'Làm quen',
    '2': 'Tiến bộ',
    '3': 'Thử thách',
  };
  return levels[level] || level;
}

function getSkillName(skill: string): string {
  const skills: Record<string, string> = {
    '1': 'Tô màu cơ bản',
    '2': 'Tô theo mẫu - Theo gợi ý',
    '3': 'Nhận diện hình & Chi tiết qua tô',
    '4': 'Điều khiển nét & tay',
    '5': 'Hoàn thiện hình/ Bổ sung nhẹ',
    '6': 'Tạo hình theo chủ đề',
  };
  return skills[skill] || skill;
}

function getThemeName(theme: string): string {
  const themes: Record<string, string> = {
    '1': 'Động vật',
    '2': 'Xe cộ',
    '3': 'Đồ chơi',
    '4': 'Âm nhạc',
    '5': 'Trái cây',
    '6': 'Rau củ',
    '7': 'Thiên nhiên – hoa lá',
    '8': 'Ngữ cảnh đời sống gần gũi',
  };
  return themes[theme] || theme;
}

// Metadata form component (inline for simplicity)
function UploadMetaForm({ values }: { values: any }) {
  const isSkillSelected = (skillId: string) => values.skills.includes(skillId);
  const isThemeSelected = (themeId: string) => values.themes.includes(themeId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Thông tin Game</h2>
      <p className="text-sm text-slate-500 mb-6">
        Điền thông tin cơ bản để bắt đầu upload game. Các trường có dấu * là bắt buộc.
      </p>

      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lớp <span className="text-red-500">*</span>
            </label>
            <select
              name="lop"
              defaultValue={values.lop}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Môn học <span className="text-red-500">*</span>
            </label>
            <select
              name="mon"
              defaultValue={values.mon}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Chọn môn</option>
              <option value="math">Toán học</option>
              <option value="vietnamese">Tiếng Việt</option>
              <option value="art">Nghệ thuật</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quyển sách
              <span className="text-slate-400 text-xs ml-1">(tùy chọn)</span>
            </label>
            <input
              type="text"
              name="quyenSach"
              defaultValue={values.quyenSach}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="VD: Tập 1, Học kỳ 1..."
              list="quyenSach-suggestions"
            />
            <datalist id="quyenSach-suggestions">
              <option value="Tập 1" />
              <option value="Tập 2" />
              <option value="Học kỳ 1" />
              <option value="Học kỳ 2" />
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bài học
              <span className="text-slate-400 text-xs ml-1">(tùy chọn)</span>
            </label>
            <input
              type="text"
              name="lesson"
              defaultValue={values.lesson}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="VD: Bài 1, Chương 2..."
              list="lesson-suggestions"
            />
            <datalist id="lesson-suggestions">
              <option value="Bài 1" />
              <option value="Bài 2" />
              <option value="Bài 3" />
              <option value="Chương 1" />
              <option value="Chương 2" />
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Game ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="game"
              defaultValue={values.game}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="com.iruka.math-addition"
              pattern="^[a-z0-9.-]+$"
              title="Chỉ được dùng chữ thường, số, dấu chấm và gạch ngang"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Định dạng: com.iruka.tên-game (chữ thường, số, dấu chấm, gạch ngang)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Độ khó
              <span className="text-slate-400 text-xs ml-1">(tùy chọn)</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="level"
                  value="1"
                  defaultChecked={values.level === "1"}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-slate-700">Làm quen</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="level"
                  value="2"
                  defaultChecked={values.level === "2"}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-slate-700">Tiến bộ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="level"
                  value="3"
                  defaultChecked={values.level === "3"}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-slate-700">Thử thách</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Link GitHub <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="github"
            defaultValue={values.github}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="https://github.com/iruka-edu/game-name"
            pattern="https://github\.com/.*"
            title="Phải là link GitHub hợp lệ"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Link đến repository GitHub chứa source code game
          </p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Kỹ năng
            <span className="text-slate-400 text-xs ml-1">(tùy chọn, có thể chọn nhiều)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="skill"
                value="1"
                defaultChecked={isSkillSelected("1")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Tô màu cơ bản</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="skill"
                value="2"
                defaultChecked={isSkillSelected("2")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Tô theo mẫu - Theo gợi ý</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="skill"
                value="3"
                defaultChecked={isSkillSelected("3")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Nhận diện hình & Chi tiết qua tô</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="skill"
                value="4"
                defaultChecked={isSkillSelected("4")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Điều khiển nét & tay</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="skill"
                value="5"
                defaultChecked={isSkillSelected("5")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Hoàn thiện hình/ Bổ sung nhẹ</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="skill"
                value="6"
                defaultChecked={isSkillSelected("6")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Tạo hình theo chủ đề</span>
            </label>
          </div>
        </div>

        {/* Themes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Sở thích/Chủ đề
            <span className="text-slate-400 text-xs ml-1">(tùy chọn, có thể chọn nhiều)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="1"
                defaultChecked={isThemeSelected("1")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Động vật</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="2"
                defaultChecked={isThemeSelected("2")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Xe cộ</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="3"
                defaultChecked={isThemeSelected("3")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Đồ chơi</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="4"
                defaultChecked={isThemeSelected("4")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Âm nhạc</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="5"
                defaultChecked={isThemeSelected("5")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Trái cây</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="6"
                defaultChecked={isThemeSelected("6")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Rau củ</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="7"
                defaultChecked={isThemeSelected("7")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Thiên nhiên – hoa lá</span>
            </label>
            <label className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="theme"
                value="8"
                defaultChecked={isThemeSelected("8")}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-slate-700">Ngữ cảnh đời sống gần gũi</span>
            </label>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Tiếp tục Upload Game
          </button>
        </div>
      </form>
    </div>
  );
}
