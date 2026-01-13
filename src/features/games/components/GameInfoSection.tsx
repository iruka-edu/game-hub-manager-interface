'use client';

import { StatusChip } from '@/components/ui/StatusChip';

interface GameData {
  _id: string;
  gameId: string;
  title?: string;
  description?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  teamId?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  createdAt: string;
  updatedAt: string;
  // Extended metadata fields
  priority?: string;
  tags?: string[];
  lesson?: string[];
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  quyenSach?: string;
  metadata?: {
    textbook?: string;
    lessonNo?: number;
    theme_primary?: string;
    theme_secondary?: string[];
    context_tags?: string[];
    difficulty_levels?: string[];
    thumbnailUrl?: string;
  };
  metadataCompleteness?: number;
}

interface GameInfoSectionProps {
  game: GameData;
  canEdit: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function GameInfoSection({ game, canEdit }: GameInfoSectionProps) {
  const renderArrayField = (items?: string[]) => {
    if (!items || items.length === 0) return '-';
    return items.join(', ');
  };

  const getCompletenessColor = (percentage?: number) => {
    if (!percentage) return 'text-gray-500';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper functions to convert codes to display text
  const getSubjectText = (subject?: string) => {
    const subjectMap: Record<string, string> = {
      'math': 'Mathematics',
      'vietnamese': 'Vietnamese',
      'english': 'English',
      'science': 'Science',
      'logic': 'Logic',
      'art': 'Art',
      'music': 'Music',
      'pe': 'Physical Education'
    };
    return subject ? (subjectMap[subject] || subject) : '-';
  };

  const getGradeText = (grade?: string) => {
    const gradeMap: Record<string, string> = {
      'pre-k': 'Pre-K',
      'k': 'Kindergarten',
      '1': 'Grade 1',
      '2': 'Grade 2',
      '3': 'Grade 3',
      '4': 'Grade 4',
      '5': 'Grade 5',
      '6': 'Grade 6',
      '7': 'Grade 7',
      '8': 'Grade 8',
      '9': 'Grade 9',
      '10': 'Grade 10',
      '11': 'Grade 11',
      '12': 'Grade 12'
    };
    return grade ? (gradeMap[grade] || grade) : '-';
  };

  const getGameTypeText = (gameType?: string) => {
    const gameTypeMap: Record<string, string> = {
      'quiz': 'Quiz',
      'drag_drop': 'Drag & Drop',
      'trace': 'Trace',
      'classify': 'Classify',
      'memory': 'Memory',
      'custom': 'Custom',
      'html5': 'HTML5 Game'
    };
    return gameType ? (gameTypeMap[gameType] || gameType) : '-';
  };

  const getTextbookText = (textbook?: string) => {
    const textbookMap: Record<string, string> = {
      'Canh Dieu': 'Cánh Diều',
      'Ket Noi Tri Thuc': 'Kết Nối Tri Thức',
      'Chan Troi Sang Tao': 'Chân Trời Sáng Tạo'
    };
    return textbook ? (textbookMap[textbook] || textbook) : '-';
  };

  const getPriorityText = (priority?: string) => {
    const priorityMap: Record<string, string> = {
      'high': 'Cao',
      'medium': 'Trung bình',
      'low': 'Thấp'
    };
    return priority ? priorityMap[priority] : '-';
  };

  const getDifficultyText = (levels?: string[]) => {
    if (!levels || levels.length === 0) return '-';
    const difficultyMap: Record<string, string> = {
      'easy': 'Dễ',
      'medium': 'Trung bình',
      'hard': 'Khó'
    };
    return levels.map(level => difficultyMap[level] || level).join(', ');
  };

  const getSkillText = (skills?: string[]) => {
    if (!skills || skills.length === 0) return '-';
    
    const skillMap: Record<string, string> = {
      '1': 'Tô màu cơ bản',
      '2': 'Tô theo mẫu - Theo gợi ý',
      '3': 'Nhận diện hình & Chi tiết qua tô',
      '4': 'Điều khiển nét & tay',
      '5': 'Hoàn thiện hình/ Bổ sung nhẹ',
      '6': 'Tạo hình theo chủ đề',
      'Skill1': 'Tô màu cơ bản',
      'Skill2': 'Tô theo mẫu - Theo gợi ý',
      'Skill3': 'Nhận diện hình & Chi tiết qua tô',
      'Skill4': 'Điều khiển nét & tay',
      'Skill5': 'Hoàn thiện hình/ Bổ sung nhẹ',
      'Skill6': 'Tạo hình theo chủ đề'
    };
    
    return skills.map(skill => skillMap[skill] || skill).join(', ');
  };

  const getThemeText = (themes?: string[]) => {
    if (!themes || themes.length === 0) return '-';
    
    const themeMap: Record<string, string> = {
      '1': 'Động vật',
      '2': 'Xe cộ',
      '3': 'Đồ chơi',
      '4': 'Âm nhạc',
      '5': 'Trái cây',
      '6': 'Rau củ',
      '7': 'Thiên nhiên – hoa lá',
      '8': 'Ngữ cảnh đời sống gần gũi',
      'Theme1': 'Động vật',
      'Theme2': 'Xe cộ',
      'Theme3': 'Đồ chơi',
      'Theme4': 'Âm nhạc',
      'Theme5': 'Trái cây',
      'Theme6': 'Rau củ',
      'Theme7': 'Thiên nhiên – hoa lá',
      'Theme8': 'Ngữ cảnh đời sống gần gũi'
    };
    
    return themes.map(theme => themeMap[theme] || theme).join(', ');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900">Thông tin chi tiết</h3>
        {game.metadataCompleteness !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Độ hoàn thiện:</span>
            <span className={`text-sm font-medium ${getCompletenessColor(game.metadataCompleteness)}`}>
              {game.metadataCompleteness}%
            </span>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
          Thông tin cơ bản
        </h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Game ID</dt>
            <dd className="font-medium text-slate-900 font-mono text-sm">{game.gameId}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Tiêu đề</dt>
            <dd className="font-medium text-slate-900">{game.title || '-'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-slate-500">Mô tả</dt>
            <dd className="font-medium text-slate-900">{game.description || '-'}</dd>
          </div>
        </dl>
      </div>

      {/* Educational Metadata */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
          Thông tin giáo dục
        </h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Lớp</dt>
            <dd className="font-medium text-slate-900">{getGradeText(game.grade)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Môn</dt>
            <dd className="font-medium text-slate-900">{getSubjectText(game.subject)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Quyển sách</dt>
            <dd className="font-medium text-slate-900">
              {getTextbookText(game.quyenSach || game.metadata?.textbook)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Link sách</dt>
            <dd className="font-medium text-slate-900">
              {game.linkGithub ? (
                <a 
                  href={game.linkGithub} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {game.linkGithub}
                </a>
              ) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Lesson + Game</dt>
            <dd className="font-medium text-slate-900">
              {game.metadata?.lessonNo ? `Bài ${game.metadata.lessonNo}` : 
               renderArrayField(game.lesson) !== '-' ? renderArrayField(game.lesson) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Level</dt>
            <dd className="font-medium text-slate-900">{game.level || '-'}</dd>
          </div>
        </dl>
      </div>

      {/* Content Classification */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
          Phân loại nội dung
        </h4>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Skill</dt>
            <dd className="font-medium text-slate-900">{getSkillText(game.skills)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Theme</dt>
            <dd className="font-medium text-slate-900">
              <div className="space-y-1">
                {game.metadata?.theme_primary && (
                  <div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Primary</span>
                    {game.metadata.theme_primary}
                  </div>
                )}
                {game.metadata?.theme_secondary && game.metadata.theme_secondary.length > 0 && (
                  <div>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2">Secondary</span>
                    {getThemeText(game.metadata.theme_secondary)}
                  </div>
                )}
                {!game.metadata?.theme_primary && !game.metadata?.theme_secondary?.length && 
                 game.themes && game.themes.length > 0 && (
                  <div>{getThemeText(game.themes)}</div>
                )}
                {!game.metadata?.theme_primary && !game.metadata?.theme_secondary?.length && 
                 (!game.themes || game.themes.length === 0) && '-'}
              </div>
            </dd>
          </div>
        </dl>
      </div>

      {/* Technical Information */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
          Thông tin kỹ thuật
        </h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Loại game</dt>
            <dd className="font-medium text-slate-900">{getGameTypeText(game.gameType)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Độ khó</dt>
            <dd className="font-medium text-slate-900">
              {getDifficultyText(game.metadata?.difficulty_levels)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Ưu tiên</dt>
            <dd className="font-medium text-slate-900">
              {game.priority ? (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  game.priority === 'high' ? 'bg-red-100 text-red-800' :
                  game.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getPriorityText(game.priority)}
                </span>
              ) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Team</dt>
            <dd className="font-medium text-slate-900">{game.teamId || '-'}</dd>
          </div>
        </dl>
      </div>

      {/* Tags and Categories */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
          Tags và phân loại
        </h4>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Tags</dt>
            <dd className="font-medium text-slate-900">
              {game.tags && game.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {game.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Context Tags</dt>
            <dd className="font-medium text-slate-900">
              {game.metadata?.context_tags && game.metadata.context_tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {game.metadata.context_tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : '-'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Thumbnails */}
      {(game.thumbnailDesktop || game.thumbnailMobile || game.metadata?.thumbnailUrl) && (
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
            Hình ảnh
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {(game.thumbnailDesktop || game.metadata?.thumbnailUrl) && (
              <div>
                <dt className="text-sm text-slate-500 mb-2">Desktop Thumbnail</dt>
                <dd>
                  <img 
                    src={game.thumbnailDesktop || game.metadata?.thumbnailUrl} 
                    alt="Desktop thumbnail"
                    className="w-full max-w-[200px] h-auto border border-slate-200 rounded"
                  />
                </dd>
              </div>
            )}
            {game.thumbnailMobile && (
              <div>
                <dt className="text-sm text-slate-500 mb-2">Mobile Thumbnail</dt>
                <dd>
                  <img 
                    src={game.thumbnailMobile} 
                    alt="Mobile thumbnail"
                    className="w-full max-w-[200px] h-auto border border-slate-200 rounded"
                  />
                </dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Information */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
          Thông tin hệ thống
        </h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Ngày tạo</dt>
            <dd className="font-medium text-slate-900">{formatDate(game.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Cập nhật lần cuối</dt>
            <dd className="font-medium text-slate-900">{formatDate(game.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
