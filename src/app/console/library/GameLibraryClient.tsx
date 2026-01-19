"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDeleteGame } from "@/features/games";

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
  uploaded: "bg-blue-100 text-blue-700",
  qc_processing: "bg-yellow-100 text-yellow-700",
  qc_passed: "bg-green-100 text-green-700",
  qc_failed: "bg-red-100 text-red-700",
  approved: "bg-purple-100 text-purple-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS = {
  draft: "Nháp",
  uploaded: "Đã gửi QC",
  qc_processing: "Đang QC",
  qc_passed: "QC đạt",
  qc_failed: "QC không đạt",
  approved: "Đã duyệt",
  published: "Đã xuất bản",
  archived: "Đã lưu trữ",
};

export function GameLibraryClient({
  initialGames,
  currentUserId,
  userRoles,
}: GameLibraryClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

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

  // Filter games based on search and filters
  const filteredGames = useMemo(() => {
    return initialGames.filter((item) => {
      const { game, latestVersion } = item;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          game.title.toLowerCase().includes(searchLower) ||
          game.gameId.toLowerCase().includes(searchLower) ||
          (game.description &&
            game.description.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (!latestVersion || latestVersion.status !== statusFilter) {
          return false;
        }
      }

      // Subject filter
      if (subjectFilter !== "all") {
        if (game.subject !== subjectFilter) {
          return false;
        }
      }

      return true;
    });
  }, [initialGames, searchTerm, statusFilter, subjectFilter]);

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
      {/* Selection Mode Bar */}
      {isSelectionMode && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-indigo-700 font-medium">
              Đã chọn {selectedGameIds.size} game
            </span>
            <button
              onClick={selectAll}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Chọn tất cả (
              {
                filteredGames.filter((item) =>
                  canDeleteGame(item.game, item.latestVersion),
                ).length
              }
              )
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Bỏ chọn
            </button>
          </div>
          <div className="flex items-center gap-3">
            {selectedGameIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Xóa ({selectedGameIds.size})
              </button>
            )}
            <button
              onClick={exitSelectionMode}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên game, Game ID..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="uploaded">Đã gửi QC</option>
              <option value="qc_processing">Đang QC</option>
              <option value="qc_passed">QC đạt</option>
              <option value="qc_failed">QC không đạt</option>
              <option value="approved">Đã duyệt</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Môn học
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Selection Mode Toggle */}
          <div className="flex items-end">
            {!isSelectionMode ? (
              <button
                onClick={() => setIsSelectionMode(true)}
                className="w-full px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
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
                Chọn nhiều
              </button>
            ) : (
              <div className="w-full text-center text-sm text-slate-500">
                Chế độ chọn đang bật
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-600">
        Hiển thị {filteredGames.length} / {initialGames.length} game
        {isAdmin && (
          <span className="ml-2 text-indigo-600">
            (Admin: có thể xóa tất cả)
          </span>
        )}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((item) => {
          const { game, latestVersion, owner } = item;
          const isSelected = selectedGameIds.has(game._id);
          const canDelete = canDeleteGame(game, latestVersion);

          return (
            <div
              key={game._id}
              className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all relative ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-200"
                  : "border-slate-200"
              }`}
            >
              {/* Selection Checkbox */}
              {isSelectionMode && canDelete && (
                <div className="absolute top-3 left-3 z-10">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(game._id)}
                      className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {/* Thumbnail */}
              <div
                className={`aspect-308/211 bg-slate-100 rounded-t-xl overflow-hidden ${
                  isSelectionMode ? "cursor-pointer" : ""
                }`}
                onClick={() =>
                  isSelectionMode && canDelete && toggleSelection(game._id)
                }
              >
                {game.thumbnailDesktop ? (
                  <Image
                    src={game.thumbnailDesktop}
                    alt={game.title}
                    width={308}
                    height={211}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title & Status */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    {game.title}
                  </h3>
                  {latestVersion && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full shrink-0 ml-2 ${
                        STATUS_COLORS[
                          latestVersion.status as keyof typeof STATUS_COLORS
                        ] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[
                        latestVersion.status as keyof typeof STATUS_LABELS
                      ] || latestVersion.status}
                    </span>
                  )}
                </div>

                {/* Game ID */}
                <p className="text-xs text-slate-500 font-mono mb-2">
                  {game.gameId}
                </p>

                {/* Metadata */}
                <div className="space-y-1 mb-3">
                  {game.subject && (
                    <div className="flex items-center text-xs text-slate-600">
                      <span className="font-medium">Môn:</span>
                      <span className="ml-1">{game.subject}</span>
                      {game.grade && (
                        <span className="ml-1">- Lớp {game.grade}</span>
                      )}
                    </div>
                  )}
                  {game.gameType && (
                    <div className="flex items-center text-xs text-slate-600">
                      <span className="font-medium">Loại:</span>
                      <span className="ml-1">{game.gameType}</span>
                    </div>
                  )}
                  {owner && (
                    <div className="flex items-center text-xs text-slate-600">
                      <span className="font-medium">Tác giả:</span>
                      <span className="ml-1">
                        {owner.name || owner.username || owner.email}
                      </span>
                    </div>
                  )}
                </div>

                {/* Version Info */}
                {latestVersion && (
                  <div className="text-xs text-slate-500 mb-3">
                    <div>Version: {latestVersion.version}</div>
                    <div>
                      Cập nhật:{" "}
                      {new Date(latestVersion.updatedAt).toLocaleDateString(
                        "vi-VN",
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Link
                    href={`/console/games/${game._id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Xem chi tiết
                  </Link>

                  <div className="flex items-center gap-2">
                    {game.disabled && (
                      <span className="text-xs text-red-600 font-medium">
                        Đã tắt
                      </span>
                    )}

                    {/* Delete button - only show if not in selection mode and can delete */}
                    {!isSelectionMode && canDelete && (
                      <button
                        onClick={() => handleDeleteSingle(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa game"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-slate-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Không tìm thấy game nào
          </h3>
          <p className="text-slate-500">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      )}

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
