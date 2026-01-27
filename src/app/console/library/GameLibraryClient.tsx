"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useDeleteGame,
  useGameFilters,
  useGameFilterActions,
} from "@/features/games";
import {
  GRADE_MAP,
  DIFFICULTY_MAP, // mapped to level
  SKILL_MAP,
  THEME_MAP,
  SUBJECT_MAP,
} from "@/lib/game-constants";

interface SerializedGame extends Record<string, unknown> {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  ownerId: string;
  subject?: string;
  grade?: string;
  gameType?: string;
  lessonNo?: string;
  level?: string;
  skills?: string[];
  themes?: string[];
  publishState?: string;
  disabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SerializedGameVersion extends Record<string, unknown> {
  _id: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface GameWithVersion {
  game: SerializedGame;
  latestVersion?: SerializedGameVersion;
  owner?: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
  };
}

interface GameLibraryClientProps {
  initialGames: GameWithVersion[];
  currentUserId: string;
  userRoles: string[];
}

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  qc: "bg-yellow-100 text-yellow-700",
  review: "bg-blue-100 text-blue-700",
  approved: "bg-purple-100 text-purple-700",
};

const STATUS_LABELS = {
  draft: "Nháp",
  qc: "Đang QC",
  review: "Chờ Duyệt",
  approved: "Đã Duyệt",
};

export function GameLibraryClient({
  initialGames,
  currentUserId,
  userRoles,
}: GameLibraryClientProps) {
  const router = useRouter();
  // Store filters
  const filters = useGameFilters();
  const {
    setSearch,
    setStatus,
    setSubject,
    setPublishState,
    setGrade,
    setLevel,
    setSkills,
    setThemes,
  } = useGameFilterActions();

  // Local filters for Library-specific filtering
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [lessonFilter, setLessonFilter] = useState<string>("");

  // Selection state
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [gamesToDelete, setGamesToDelete] = useState<GameWithVersion[]>([]);

  const deleteGameMutation = useDeleteGame();

  // Check if user is admin
  const isAdmin =
    userRoles.includes("admin") ||
    userRoles.includes("cto") ||
    userRoles.includes("ceo");

  // Extract unique creators for filter dropdown
  const creators = useMemo(() => {
    const map = new Map<string, string>();
    initialGames.forEach((item) => {
      if (item.owner) {
        map.set(
          item.owner._id,
          item.owner.name ||
            item.owner.username ||
            item.owner.email ||
            "Unknown",
        );
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [initialGames]);

  // Client-side filtering logic
  const filteredGames = useMemo(() => {
    let result = initialGames;

    // Search filter (name, ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.game.title.toLowerCase().includes(searchLower) ||
          item.game.gameId.toLowerCase().includes(searchLower),
      );
    }

    // Status filter (lifecycle)
    if (filters.status && filters.status !== "all") {
      result = result.filter(
        (item) => item.latestVersion?.status === filters.status,
      );
    }

    // Publish state filter
    if (filters.publishState && filters.publishState !== "all") {
      result = result.filter((item) => {
        const isPublished = item.game.publishState === "published";
        return filters.publishState === "published"
          ? isPublished
          : !isPublished;
      });
    }

    // Subject filter
    if (filters.subject && filters.subject !== "all") {
      result = result.filter((item) => item.game.subject === filters.subject);
    }

    // Grade filter
    if (filters.grade && filters.grade !== "all") {
      result = result.filter((item) => item.game.grade === filters.grade);
    }

    // Level filter
    if (filters.level && filters.level !== "all") {
      result = result.filter((item) => item.game.level === filters.level);
    }

    // Skills filter
    if (
      filters.skills &&
      filters.skills !== "all" &&
      Array.isArray(filters.skills) &&
      filters.skills.length > 0
    ) {
      result = result.filter(
        (item) =>
          filters.skills !== "all" &&
          item.game.skills?.some((s) =>
            (filters.skills as string[]).includes(s),
          ),
      );
    }

    // Themes filter
    if (
      filters.themes &&
      filters.themes !== "all" &&
      Array.isArray(filters.themes) &&
      filters.themes.length > 0
    ) {
      result = result.filter(
        (item) =>
          filters.themes !== "all" &&
          item.game.themes?.some((t) =>
            (filters.themes as string[]).includes(t),
          ),
      );
    }

    // Creator filter (local)
    if (creatorFilter !== "all") {
      result = result.filter((item) => item.owner?._id === creatorFilter);
    }

    // Lesson filter (local)
    if (lessonFilter.trim()) {
      const lessonLower = lessonFilter.toLowerCase().trim();
      result = result.filter((item) =>
        item.game.lessonNo?.toLowerCase().includes(lessonLower),
      );
    }

    return result;
  }, [initialGames, filters, creatorFilter, lessonFilter]);

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const subjectSet = new Set<string>();
    initialGames.forEach((item) => {
      if (item.game.subject) {
        subjectSet.add(item.game.subject);
      }
    });
    return Array.from(subjectSet).sort();
  }, [initialGames]);

  // Check if user can delete a game
  const canDeleteGame = useCallback(
    (game: SerializedGame, latestVersion?: SerializedGameVersion) => {
      if (isAdmin) return true;
      // Owner can only delete their own DRAFT games (not yet submitted to QC)
      if (game.ownerId !== currentUserId) return false;
      // If no version exists, can delete
      if (!latestVersion) return true;
      // Only draft versions can be deleted by owner
      return latestVersion.status === "draft";
    },
    [isAdmin, currentUserId],
  );

  // Handle selection toggle
  const toggleSelection = useCallback((gameId: string) => {
    setSelectedGameIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  }, []);

  // Select all visible games (that can be deleted)
  const selectAll = useCallback(() => {
    const deletableGameIds = filteredGames
      .filter((item) => canDeleteGame(item.game, item.latestVersion))
      .map((item) => item.game._id);
    setSelectedGameIds(new Set(deletableGameIds));
  }, [filteredGames, canDeleteGame]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedGameIds(new Set());
  }, []);

  // Get selected games for deletion
  const getSelectedGamesForDeletion = useCallback(() => {
    return filteredGames.filter(
      (item) =>
        selectedGameIds.has(item.game._id) &&
        canDeleteGame(item.game, item.latestVersion),
    );
  }, [filteredGames, selectedGameIds, canDeleteGame]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((games: GameWithVersion[]) => {
    setGamesToDelete(games);
    setDeleteError(null);
    setShowDeleteModal(true);
  }, []);

  // Delete single game
  const handleDeleteSingle = useCallback(
    (item: GameWithVersion) => {
      openDeleteModal([item]);
    },
    [openDeleteModal],
  );

  // Delete selected games
  const handleDeleteSelected = useCallback(() => {
    const games = getSelectedGamesForDeletion();
    if (games.length > 0) {
      openDeleteModal(games);
    }
  }, [getSelectedGamesForDeletion, openDeleteModal]);

  // Perform delete
  const performDelete = async () => {
    if (gamesToDelete.length === 0) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      // Delete games in parallel
      await Promise.all(
        gamesToDelete.map((item) =>
          deleteGameMutation.mutateAsync(item.game._id),
        ),
      );

      // Success - close modal and refresh
      setShowDeleteModal(false);
      setSelectedGameIds(new Set());
      setIsSelectionMode(false);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedGameIds(new Set());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 space-y-6 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Bộ lọc
            </h3>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tên game, ID..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Trạng thái
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">📝 Nháp</option>
                  <option value="qc">🔍 Đang QC (Locked)</option>
                  <option value="review">⚖️ Review (Locked)</option>
                  <option value="approved">✅ Đã duyệt</option>
                </select>
              </div>
              {/* Publish State Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Xuất bản
                </label>
                <select
                  value={filters.publishState}
                  onChange={(e) => setPublishState(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="published">🚀 Đã xuất bản</option>
                  <option value="unpublished">📁 Chưa xuất bản</option>
                </select>
              </div>

              {/* Creator Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Người tạo
                </label>
                <select
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả người tạo</option>
                  {creators.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lesson Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Bài học (ID/No)
                </label>
                <input
                  type="text"
                  value={lessonFilter}
                  onChange={(e) => setLessonFilter(e.target.value)}
                  placeholder="Lọc theo bài học..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Môn học
                </label>
                <select
                  value={filters.subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả môn học</option>
                  {Object.entries(SUBJECT_MAP).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Lớp / Khối
                </label>
                <select
                  value={filters.grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả lớp</option>
                  {Object.entries(GRADE_MAP).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level / Difficulty Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Độ khó
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả độ khó</option>
                  {Object.entries(DIFFICULTY_MAP).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Kỹ năng
                </label>
                <select
                  value={
                    filters.skills === "all"
                      ? "all"
                      : filters.skills.length > 0
                        ? filters.skills[0]
                        : "all"
                  }
                  onChange={(e) =>
                    setSkills(
                      e.target.value === "all" ? "all" : [e.target.value],
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả kỹ năng</option>
                  {Object.entries(SKILL_MAP)
                    .filter(([key]) => /^\d+$/.test(key))
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Themes Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                  Chủ đề / Sở thích
                </label>
                <select
                  value={
                    filters.themes === "all"
                      ? "all"
                      : filters.themes.length > 0
                        ? filters.themes[0]
                        : "all"
                  }
                  onChange={(e) =>
                    setThemes(
                      e.target.value === "all" ? "all" : [e.target.value],
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="all">Tất cả chủ đề</option>
                  {Object.entries(THEME_MAP)
                    .filter(([key]) => /^\d+$/.test(key))
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Bulk Actions Toggle */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (isSelectionMode) exitSelectionMode();
                    else setIsSelectionMode(true);
                  }}
                  className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isSelectionMode
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {isSelectionMode ? (
                    <>
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Thoát chọn nhiều
                    </>
                  ) : (
                    <>
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Chọn nhiều game
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Stats Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-slate-600">
              Hiển thị{" "}
              <span className="text-slate-900 font-bold">
                {filteredGames.length}
              </span>{" "}
              kết quả
              {isAdmin && (
                <span className="ml-2 text-xs text-indigo-600 font-normal bg-indigo-50 px-2 py-0.5 rounded-full">
                  Admin Access
                </span>
              )}
            </div>

            {/* Sort Controls (Placeholder for now as logic is in store but UI needed) */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Sắp xếp:</span>
              <select
                className="text-sm border-none bg-transparent font-medium text-slate-900 focus:ring-0 cursor-pointer p-0"
                defaultValue="updated_at"
              >
                <option value="updated_at">Mới cập nhật</option>
                <option value="created_at">Mới tạo</option>
                <option value="title">Tên A-Z</option>
              </select>
            </div>
          </div>

          {/* Selection Bar */}
          {isSelectionMode && selectedGameIds.size > 0 && (
            <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold">
                  {selectedGameIds.size}
                </div>
                <span className="text-sm text-indigo-800 font-medium">
                  game đã chọn
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1"
                >
                  Chọn tất cả
                </button>
                <div className="h-4 w-px bg-indigo-200 mx-1"></div>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-red-200"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Xóa
                </button>
              </div>
            </div>
          )}

          {/* Games Grid */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((item) => {
                const { game, latestVersion, owner } = item;
                const isSelected = selectedGameIds.has(game._id);
                const canDelete = canDeleteGame(game, latestVersion);

                // Determine status config
                const statusKey = (latestVersion?.status ||
                  "draft") as keyof typeof STATUS_COLORS;
                const statusColor =
                  STATUS_COLORS[statusKey] || STATUS_COLORS.draft;
                const statusLabel =
                  STATUS_LABELS[statusKey] || latestVersion?.status || "Nháp";

                const isPublished = game.publishState === "published";
                const isLocked =
                  latestVersion?.status === "qc" ||
                  latestVersion?.status === "review";

                return (
                  <div
                    key={game._id}
                    className={`group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all relative flex flex-col h-full ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-200 z-10"
                        : "border-slate-200"
                    } ${!isPublished && !isLocked ? "opacity-90 hover:opacity-100" : ""}`}
                  >
                    {/* Selection Checkbox */}
                    {isSelectionMode && canDelete && (
                      <div className="absolute top-3 left-3 z-20">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(game._id)}
                            className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer shadow-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Thumbnail Container */}
                    <div
                      className={`aspect-video bg-slate-100 rounded-t-xl overflow-hidden relative ${
                        isSelectionMode ? "cursor-pointer" : ""
                      }`}
                      onClick={() =>
                        isSelectionMode &&
                        canDelete &&
                        toggleSelection(game._id)
                      }
                    >
                      <Image
                        src={
                          game.thumbnailDesktop ||
                          `https://storage.googleapis.com/iruka-edu-mini-game/games/${game.gameId}/thumbnails/desktop.png`
                        }
                        alt={game.title}
                        width={308}
                        height={173}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                        onError={(e) => {
                          // Fallback to placeholder if image load fails
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement?.classList.add(
                            "fallback-placeholder",
                          );
                        }}
                      />
                      {/* Fallback placeholder (shown via CSS when image hidden) */}
                      <div className="hidden fallback-placeholder:flex w-full h-full absolute inset-0 items-center justify-center text-slate-400 bg-slate-50">
                        <svg
                          className="w-10 h-10 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>

                      {/* Status Badges Overlay */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        {/* Locked Status */}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/75 text-white text-xs font-bold backdrop-blur-xs shadow-sm">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            Locked
                          </span>
                        )}

                        {/* Publish State Badge */}
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/90 text-white text-xs font-bold backdrop-blur-xs shadow-sm">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-500/50 text-white text-xs font-medium backdrop-blur-xs shadow-sm">
                            Unpublished
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col h-full">
                      {/* Header */}
                      <div className="mb-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="font-bold text-slate-900 text-base leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors"
                            title={game.title}
                          >
                            {game.title}
                          </h3>
                        </div>
                        <div className="flex items-center flex-wrap mt-2 gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusColor}`}
                          >
                            {statusLabel}
                          </span>
                          <span
                            className="text-[10px] text-slate-400 font-mono"
                            title={game.gameId}
                          >
                            ID: {game.gameId}
                          </span>
                        </div>
                      </div>

                      {/* Curriculum / Metadata Section */}
                      <div className="space-y-2 mb-4">
                        {/* Grade, Subject, Lesson */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Lớp:</span>
                            <span className="text-slate-700 font-medium">
                              {GRADE_MAP[
                                game.grade as keyof typeof GRADE_MAP
                              ] ||
                                game.grade ||
                                "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Môn:</span>
                            <span className="text-slate-700 font-medium">
                              {game.subject || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Bài:</span>
                            <span className="text-slate-700 font-medium font-mono text-[11px]">
                              {game.lessonNo || "-"}
                            </span>
                          </div>
                        </div>

                        {/* Level / Difficulty */}
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[11px] text-slate-400">
                            Độ khó:
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {DIFFICULTY_MAP[
                              game.level as keyof typeof DIFFICULTY_MAP
                            ] ||
                              game.level ||
                              "Cơ bản"}
                          </span>
                        </div>

                        {/* Skills & Themes */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {game.skills?.slice(0, 2).map((skill) => (
                            <span
                              key={skill}
                              className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded border border-indigo-100"
                            >
                              {SKILL_MAP[skill as keyof typeof SKILL_MAP] ||
                                skill}
                            </span>
                          ))}
                          {game.themes?.slice(0, 1).map((theme) => (
                            <span
                              key={theme}
                              className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded border border-amber-100"
                            >
                              {THEME_MAP[theme as keyof typeof THEME_MAP] ||
                                theme}
                            </span>
                          ))}
                          {(game.skills?.length || 0) +
                            (game.themes?.length || 0) >
                            3 && (
                            <span className="text-[10px] text-slate-400 px-1">
                              +
                              {(game.skills?.length || 0) +
                                (game.themes?.length || 0) -
                                3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="mt-auto pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] shrink-0">
                              {owner?.name?.charAt(0) ||
                                owner?.username?.charAt(0) ||
                                "D"}
                            </div>
                            <span
                              className="text-[11px] text-slate-500 truncate"
                              title={
                                owner?.name || owner?.username || "Developer"
                              }
                            >
                              {owner?.name || owner?.username || "Developer"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            v{latestVersion?.version || "1.0.0"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-slate-400">
                            CN:{" "}
                            {new Date(game.updatedAt).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              },
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/console/games/${game._id}`}
                              className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all flex items-center gap-1"
                            >
                              Chi tiết
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <svg
                  className="w-8 h-8 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                Không tìm thấy game
              </h3>
              <p className="text-slate-500 text-sm max-w-xs text-center">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm thấy kết quả.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("all" as any);
                  setPublishState("all" as any);
                  setSubject("all");
                  setCreatorFilter("all");
                  setLessonFilter("");
                }}
                className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => !deleteLoading && setShowDeleteModal(false)}
            />

            {/* Modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Xác nhận xóa game
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Bạn có chắc chắn muốn xóa{" "}
                      {gamesToDelete.length > 1
                        ? `${gamesToDelete.length} game`
                        : `game "${gamesToDelete[0]?.game.title}"`}
                      ? Hành động này có thể hoàn tác bằng cách khôi phục từ
                      thùng rác.
                    </p>

                    {/* List games to delete */}
                    {gamesToDelete.length > 1 && (
                      <div className="mt-3 max-h-40 overflow-y-auto">
                        <ul className="text-sm text-slate-600 space-y-1">
                          {gamesToDelete.map((item) => (
                            <li
                              key={item.game._id}
                              className="flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                              <span className="truncate">
                                {item.game.title}
                              </span>
                              <span className="text-slate-400 text-xs font-mono">
                                ({item.game.gameId})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {deleteError && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{deleteError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={performDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      Xóa{" "}
                      {gamesToDelete.length > 1
                        ? `${gamesToDelete.length} game`
                        : "game"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
