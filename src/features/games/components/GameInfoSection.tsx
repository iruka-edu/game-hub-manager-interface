"use client";

import Image from "next/image";
import {
  SUBJECT_MAP,
  GRADE_MAP,
  GAME_TYPE_MAP,
  TEXTBOOK_MAP,
  PRIORITY_MAP,
  DIFFICULTY_MAP,
  SKILL_MAP,
  THEME_MAP,
} from "@/lib/game-constants";
import { GameAutoTestPanel } from "./GameAutoTestPanel";

// Default thumbnail URL
const DEFAULT_THUMBNAIL_URL =
  "https://storage.googleapis.com/iruka-edu-mini-game/games/com.iruka.game-test-1/thumbnails/desktop.png";

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
  lesson?: string | string[];
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  gcs_path?: string;
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
  userId?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export function GameInfoSection({ game, canEdit }: GameInfoSectionProps) {
  const renderArrayField = (items?: string | string[]) => {
    if (!items) return "-";

    // Handle single string
    if (typeof items === "string") {
      return items.trim() === "" ? "-" : items;
    }

    // Handle array
    if (Array.isArray(items)) {
      if (items.length === 0) return "-";
      return items.join(", ");
    }

    return "-";
  };

  const getCompletenessColor = (percentage?: number) => {
    if (!percentage) return "text-gray-500";
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Helper functions to convert codes to display text
  const getSubjectText = (subject?: string) => {
    return subject ? SUBJECT_MAP[subject] || subject : "-";
  };

  const getGradeText = (grade?: string) => {
    return grade ? GRADE_MAP[grade] || grade : "-";
  };

  const getGameTypeText = (gameType?: string) => {
    return gameType ? GAME_TYPE_MAP[gameType] || gameType : "-";
  };

  const getTextbookText = (textbook?: string) => {
    return textbook ? TEXTBOOK_MAP[textbook] || textbook : "-";
  };

  const getPriorityText = (priority?: string) => {
    return priority ? PRIORITY_MAP[priority] || priority : "-";
  };

  const getDifficultyText = (levels?: string[]) => {
    if (!levels || levels.length === 0) return "-";
    return levels.map((level) => DIFFICULTY_MAP[level] || level).join(", ");
  };

  const getSkillText = (skills?: string[]) => {
    if (!skills || skills.length === 0) return "-";
    return skills.map((skill) => SKILL_MAP[skill] || skill).join(", ");
  };

  const getThemeText = (themes?: string[]) => {
    if (!themes || themes.length === 0) return "-";
    return themes.map((theme) => THEME_MAP[theme] || theme).join(", ");
  };

  const getValidSrc = (...srcs: any[]) => {
    return (
      srcs.find((s) => typeof s === "string" && s.trim() !== "") ||
      DEFAULT_THUMBNAIL_URL
    );
  };

  const InfoItem = ({
    label,
    value,
    icon,
    mono = false,
  }: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    mono?: boolean;
  }) => (
    <div className="group transition-all">
      <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
      </dt>
      <dd
        className={`text-slate-900 font-medium whitespace-normal break-all ${mono
          ? "font-mono text-[13px] bg-slate-50 px-2 py-1 rounded border border-slate-100"
          : "text-sm"
        }`}
      >
        {value || "-"}
      </dd>
    </div>
  );

  return (
    <>
      <GameAutoTestPanel
        gameId={game.gameId}
        versionId={game._id}        // tạm truyền gì cũng được
        gcsPath={game.gcs_path}
      />
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Thông tin chi tiết</h3>
          {game.metadataCompleteness !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Độ hoàn thiện:</span>
              <span
                className={`text-sm font-medium ${getCompletenessColor(
                  game.metadataCompleteness,
                )}`}
              >
                {game.metadataCompleteness}%
              </span>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="mb-10">
          <h4 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            THÔNG TIN CƠ BẢN
          </h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <InfoItem
              label="Game ID (GCS)"
              value={game.gameId}
              mono
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              }
            />
            <InfoItem
              label="Tên game"
              value={game.title}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
            />
            <div className="md:col-span-2 lg:col-span-1">
              <InfoItem
                label="Mô tả"
                value={game.description}
                icon={
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                }
              />
            </div>
          </dl>
        </div>

        {/* Educational Metadata */}
        <div className="mb-10">
          <h4 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            THÔNG TIN GIÁO DỤC
          </h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <InfoItem
              label="Lớp"
              value={getGradeText(game.grade)}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                  />
                </svg>
              }
            />
            <InfoItem
              label="Môn"
              value={getSubjectText(game.subject)}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              }
            />
            <InfoItem
              label="Quyển sách"
              value={getTextbookText(game.quyenSach || game.metadata?.textbook)}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 19a2 2 0 012-2h10a2 2 0 012 2v2H5v-2zM7 11V7a5 5 0 0110 0v4"
                  />
                </svg>
              }
            />

            <div className="lg:col-span-2">
              <InfoItem
                label="Link GitHub"
                value={
                  game.linkGithub ? (
                    <a
                      href={game.linkGithub}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 transition-colors font-mono flex items-center gap-1.5"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                      {game.linkGithub}
                    </a>
                  ) : (
                    "-"
                  )
                }
                icon={
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                }
              />
            </div>

            <InfoItem
              label="Bài học"
              value={
                game.metadata?.lessonNo
                  ? `Bài ${game.metadata.lessonNo}`
                  : renderArrayField(game.lesson)
              }
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              }
            />
          </dl>
        </div>

        {/* Content Classification */}
        <div className="mb-10">
          <h4 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            PHÂN LOẠI NỘI DUNG
          </h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InfoItem
              label="Skills"
              value={getSkillText(game.skills)}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              }
            />
            <InfoItem
              label="Themes"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-1.657 1.657"
                  />
                </svg>
              }
              value={
                <div className="flex flex-wrap gap-2 pt-1">
                  {game.metadata?.theme_primary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                      {game.metadata.theme_primary}
                    </span>
                  )}
                  {game.metadata?.theme_secondary?.map((theme, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-100 uppercase tracking-wider"
                    >
                      {THEME_MAP[theme] || theme}
                    </span>
                  ))}
                  {!game.metadata?.theme_primary &&
                    !game.metadata?.theme_secondary?.length &&
                    getThemeText(game.themes)}
                </div>
              }
            />
          </dl>
        </div>

        {/* Technical Information */}
        <div className="mb-10">
          <h4 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            THÔNG TIN KỸ THUẬT
          </h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <InfoItem
              label="Loại game"
              value={getGameTypeText(game.gameType)}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <InfoItem
              label="Độ khó"
              value={game.level || getDifficultyText(game.metadata?.difficulty_levels)}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
            <InfoItem
              label="Đội ngũ"
              value={game.teamId}
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />
            <InfoItem
              label="Ưu tiên"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              }
              value={
                game.priority ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      game.priority === "high"
                        ? "bg-red-50 text-red-600"
                        : game.priority === "medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {getPriorityText(game.priority)}
                  </span>
                ) : (
                  "-"
                )
              }
            />
          </dl>
        </div>

        {/* Tags and Categories */}
        {/* <div className="mb-10">
          <h4 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            TAGS VÀ PHÂN LOẠI
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoItem
              label="Tags"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              }
              value={
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {game.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded border border-slate-200 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                  {!game.tags?.length && "-"}
                </div>
              }
            />
            <InfoItem
              label="Context Tags"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              value={
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {game.metadata?.context_tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-bold rounded border border-blue-100 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                  {!game.metadata?.context_tags?.length && "-"}
                </div>
              }
            />
          </div>
        </div> */}

        {/* Thumbnails */}
        {(game.thumbnailDesktop ||
          game.thumbnailMobile ||
          game.metadata?.thumbnailUrl) && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-200">
              Thumbnail (Ảnh preview)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {(game.thumbnailDesktop || game.metadata?.thumbnailUrl) && (
                <div>
                  <dt className="text-sm text-slate-500 mb-2">
                    Desktop (308×211)
                  </dt>
                  <dd>
                    <Image
                      src={getValidSrc(
                        game.thumbnailDesktop,
                        game.metadata?.thumbnailUrl,
                      )}
                      alt="Desktop thumbnail"
                      width={308}
                      height={211}
                      className="w-full max-w-[200px] h-auto border border-slate-200 rounded"
                    />
                  </dd>
                </div>
              )}
              {game.thumbnailMobile && (
                <div>
                  <dt className="text-sm text-slate-500 mb-2">
                    Mobile (343×170)
                  </dt>
                  <dd>
                    <Image
                      src={getValidSrc(game.thumbnailMobile)}
                      alt="Mobile thumbnail"
                      width={343}
                      height={170}
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
              <dd className="font-medium text-slate-900">
                {formatDate(game.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Cập nhật lần cuối</dt>
              <dd className="font-medium text-slate-900">
                {formatDate(game.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
