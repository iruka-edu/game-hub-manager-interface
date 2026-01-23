"use client";

import { 
  useSubjects, 
  useLevels, 
  useSkills, 
  useThemes 
} from "@/features/game-lessons/hooks/useGameLessons";

interface MetadataSummaryProps {
  meta: {
    lop: string;
    mon: string;
    quyenSach: string;
    lessonNo: string;
    level: string;
    game: string;
    gameId: string;
    skills: string[];
    themes: string[];
    github: string;
  };
}

export function MetadataSummary({ meta }: MetadataSummaryProps) {
  // Fetch data from game-lessons API
  const { data: subjects } = useSubjects();
  const { data: levels } = useLevels();
  const { data: skills } = useSkills();
  const { data: themes } = useThemes();

  // Helper functions to get names from API data
  const getSubjectName = (subjectId: string) => {
    const subject = subjects?.find(s => s.id === subjectId || s.code === subjectId);
    return subject?.name || subjectId;
  };

  const getLevelName = (levelId: string) => {
    const level = levels?.find(l => l.id === levelId);
    return level?.name || levelId;
  };

  const getSkillNames = (skillIds: string[]) => {
    return skillIds.map(skillId => {
      const skill = skills?.find(s => s.id === skillId);
      return skill?.name || skillId;
    }).join(', ');
  };

  const getThemeNames = (themeIds: string[]) => {
    return themeIds.map(themeId => {
      const theme = themes?.find(t => t.id === themeId);
      return theme?.name || themeId;
    }).join(', ');
  };
  const items = [
    { label: 'Lớp', value: meta.lop },
    { label: 'Môn', value: getSubjectName(meta.mon) },
    { label: 'Game ID (GCS)', value: meta.gameId, mono: true },
    meta.quyenSach && { label: 'Quyển sách', value: meta.quyenSach },
    meta.lessonNo && { label: 'Bài học', value: `Bài ${meta.lessonNo}` },
    meta.level && { label: 'Độ khó', value: getLevelName(meta.level) },
    meta.skills.length > 0 && {
      label: 'Kỹ năng',
      value: getSkillNames(meta.skills),
    },
    meta.themes.length > 0 && {
      label: 'Chủ đề',
      value: getThemeNames(meta.themes),
    },
  ].filter(Boolean);

  return (
    <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 shadow-sm p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-bold text-slate-900">Thông tin Metadata</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {items.map((item: any, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-indigo-200 shadow-sm"
              >
                <span className="text-xs font-medium text-slate-600">{item.label}:</span>
                <span className={`text-xs font-semibold text-slate-900 ${item.mono ? 'font-mono' : ''}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {meta.github && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <a
                href={meta.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
              >
                {meta.github}
              </a>
            </div>
          )}
        </div>

        <a
          href="/upload"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white rounded-lg border border-slate-300 hover:border-slate-400 transition-all shadow-sm hover:shadow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Sửa
        </a>
      </div>
    </div>
  );
}
