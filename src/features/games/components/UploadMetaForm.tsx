"use client";

import { useState } from "react";
import { 
  useSubjects, 
  useAgeBands,
  useLevels, 
  useSkills, 
  useThemes 
} from "@/features/game-lessons/hooks/useGameLessons";

interface UploadMetaFormProps {
  values: {
    lop: string;
    mon: string;
    quyenSach: string;
    lessonNo: string;
    level: string;
    game: string;
    skills: string[];
    themes: string[];
    github: string;
  };
}


export function UploadMetaForm({ values }: UploadMetaFormProps) {
  // Fetch data from game-lessons API
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: ageBands, isLoading: ageBandsLoading } = useAgeBands();
  const { data: levels, isLoading: levelsLoading } = useLevels();
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const { data: themes, isLoading: themesLoading } = useThemes();

  const [selectedSkills, setSelectedSkills] = useState<string[]>(values.skills);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(values.themes);

  // Helper function to create grade options from age bands
  const getGradeOptions = () => {
    if (!ageBands) return [];
    
    // Create grade options based on Vietnamese education system
    const gradeOptions = [];
    for (let grade = 1; grade <= 12; grade++) {
      const ageBand = ageBands.find(ab => 
        ab.min_age === grade + 5 && ab.max_age === grade + 6
      );
      
      gradeOptions.push({
        value: grade.toString(),
        label: `Lớp ${grade} (${grade + 5}-${grade + 6} tuổi)`,
        ageBandName: ageBand?.name || `${grade + 5}-${grade + 6} tuổi`
      });
    }
    return gradeOptions;
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    );
  };

  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId)
        ? prev.filter((id) => id !== themeId)
        : [...prev, themeId],
    );
  };

  // Loading state
  const isLoading = subjectsLoading || ageBandsLoading || levelsLoading || skillsLoading || themesLoading;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-50 to-blue-50 px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thông tin Game</h2>
            <p className="text-sm text-slate-600">
              Điền thông tin cơ bản để bắt đầu upload game
            </p>
          </div>
        </div>
      </div>

      <form className="p-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Required Fields Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Thông tin bắt buộc
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lớp <span className="text-red-500">*</span>
              </label>
              <select
                name="lop"
                defaultValue={values.lop}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                required
              >
                <option value="">Chọn lớp học</option>
                {getGradeOptions().map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Môn học <span className="text-red-500">*</span>
              </label>
              <select
                name="mon"
                defaultValue={values.mon}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                required
              >
                <option value="">Chọn môn học</option>
                {subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Game ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Game ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="game"
              defaultValue={values.game}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-sm"
              placeholder="com.iruka.math-addition"
              pattern="^[a-z0-9.-]+$"
              title="Chỉ được dùng chữ thường, số, dấu chấm và gạch ngang"
              required
            />
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Định dạng: com.iruka.tên-game (chữ thường, số, dấu chấm, gạch
              ngang)
            </p>
          </div>

          {/* GitHub Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link GitHub <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="url"
                name="github"
                defaultValue={values.github}
                className="w-full pl-11 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="https://github.com/iruka-edu/game-name"
                pattern="https://github\.com/.*"
                title="Phải là link GitHub hợp lệ"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Link đến repository GitHub chứa source code game
            </p>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Độ khó <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {levels?.map((level) => (
                <label
                  key={level.id}
                  className="relative flex items-center justify-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50 has-checked:border-indigo-600 has-checked:bg-indigo-50"
                >
                  <input
                    type="radio"
                    name="level"
                    value={level.id}
                    defaultChecked={values.level === level.id}
                    className="sr-only"
                    required
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {level.order === 1 ? "🌱" : level.order === 2 ? "⭐" : "🔥"}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {level.name}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-slate-300 bg-white transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-600 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100"
                      fill="currentColor"
                      viewBox="0 0 12 12"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Thông tin bổ sung (tùy chọn)
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Book */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quyển sách
              </label>
              <input
                type="text"
                name="quyenSach"
                defaultValue={values.quyenSach}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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

            {/* Lesson - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số bài học <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="lessonNo"
                defaultValue={values.lessonNo ? parseInt(values.lessonNo) || '' : ''}
                min="1"
                max="999"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="VD: 1, 2, 3..."
                required
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Số thứ tự bài học (1-999)
              </p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Kỹ năng
              <span className="text-slate-400 text-xs ml-2 font-normal">
                (có thể chọn nhiều)
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {skills?.map((skill) => (
                <label
                  key={skill.id}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer transition-all hover:bg-slate-50 has-checked:bg-indigo-50 has-checked:border-indigo-300"
                >
                  <input
                    type="checkbox"
                    name="skill"
                    value={skill.id}
                    checked={selectedSkills.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{skill.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Themes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Sở thích/Chủ đề
              <span className="text-slate-400 text-xs ml-2 font-normal">
                (có thể chọn nhiều)
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {themes?.map((theme) => (
                <label
                  key={theme.id}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer transition-all hover:bg-slate-50 has-checked:bg-indigo-50 has-checked:border-indigo-300"
                >
                  <input
                    type="checkbox"
                    name="theme"
                    value={theme.id}
                    checked={selectedThemes.includes(theme.id)}
                    onChange={() => toggleTheme(theme.id)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xl">
                    {/* Default icons based on theme name or category */}
                    {theme.name.toLowerCase().includes('động vật') ? '🐾' :
                     theme.name.toLowerCase().includes('xe') ? '🚗' :
                     theme.name.toLowerCase().includes('đồ chơi') ? '🧸' :
                     theme.name.toLowerCase().includes('âm nhạc') ? '🎵' :
                     theme.name.toLowerCase().includes('trái cây') ? '🍎' :
                     theme.name.toLowerCase().includes('rau') ? '🥕' :
                     theme.name.toLowerCase().includes('thiên nhiên') || theme.name.toLowerCase().includes('hoa') ? '🌸' :
                     theme.name.toLowerCase().includes('đời sống') || theme.name.toLowerCase().includes('nhà') ? '🏠' :
                     '🎯'}
                  </span>
                  <span className="text-sm text-slate-700">{theme.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Tiếp tục Upload Game
              </>
            )}
          </button>
        </div>
        </>
        )}

        {/* Error State */}
        {!isLoading && (!subjects || !ageBands || !levels || !skills || !themes) && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Không thể tải dữ liệu</h3>
              <p className="text-slate-600 mb-4">Có lỗi xảy ra khi tải thông tin từ hệ thống. Vui lòng thử lại.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
