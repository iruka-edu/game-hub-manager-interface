"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { StatusChip } from "@/components/ui/StatusChip";
import type { VersionStatus } from "@/models/GameVersion";

interface GameData {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  gameType?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  version: string;
  versionId: string;
  status: VersionStatus;
  submittedAt: string;
  publishedAt?: string;
  ownerName: string;
  qcAttempts: number;
  isRetest: boolean;
  buildSize?: number;
  selfQAChecklist?: any;
}

interface QCInboxClientProps {
  pendingGames: GameData[];
  publishedGames: GameData[];
  userRoles: string[];
}

export function QCInboxClient({
  pendingGames,
  publishedGames,
  userRoles,
}: QCInboxClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "published">(
    "pending"
  );
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "owner">("date");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const isAdmin = userRoles.includes("admin");
  const isQC = userRoles.includes("qc");

  // Handle bulk QC review
  const handleBulkReview = async (decision: "pass" | "fail") => {
    if (selectedGames.size === 0) return;

    const confirmMessage =
      decision === "pass"
        ? `Bạn có chắc chắn muốn PASS ${selectedGames.size} game đã chọn?`
        : `Bạn có chắc chắn muốn FAIL ${selectedGames.size} game đã chọn?`;

    if (!confirm(confirmMessage)) return;

    setBulkProcessing(true);

    try {
      const selectedGamesList = Array.from(selectedGames);
      const results = await Promise.allSettled(
        selectedGamesList.map(async (gameId) => {
          const game = [...pendingGames, ...publishedGames].find(
            (g) => g._id === gameId
          );
          if (!game) throw new Error(`Game ${gameId} not found`);

          const response = await fetch(`/api/games/${gameId}/qc-review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              versionId: game.versionId,
              decision,
              qaSummary: {
                overall: decision,
                bulkReview: true,
                categories: {},
              },
              notes: `Bulk ${decision} review`,
              reviewerName: "QC Team",
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(
              data.error || `Failed to ${decision} game ${game.title}`
            );
          }

          return { gameId, title: game.title, success: true };
        })
      );

      // Count successes and failures
      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (successes > 0) {
        alert(
          `Thành công: ${successes} game đã được ${
            decision === "pass" ? "pass" : "fail"
          }`
        );
      }
      if (failures > 0) {
        alert(`Lỗi: ${failures} game không thể xử lý. Vui lòng thử lại.`);
      }

      // Clear selection and refresh
      setSelectedGames(new Set());
      window.location.reload(); // Simple refresh - in production, use proper state management
    } catch (error) {
      console.error("Bulk review error:", error);
      alert("Có lỗi xảy ra khi xử lý bulk review");
    } finally {
      setBulkProcessing(false);
    }
  };

  // Filter and sort games
  const filteredGames = useMemo(() => {
    const games = activeTab === "pending" ? pendingGames : publishedGames;

    let filtered = games;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = games.filter(
        (game) =>
          game.title.toLowerCase().includes(term) ||
          game.gameId.toLowerCase().includes(term) ||
          game.ownerName.toLowerCase().includes(term) ||
          game.subject?.toLowerCase().includes(term) ||
          game.grade?.toLowerCase().includes(term)
      );
    }

    // Sort games
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "owner":
          return a.ownerName.localeCompare(b.ownerName);
        case "date":
        default:
          const dateA = new Date(
            activeTab === "pending"
              ? a.submittedAt
              : a.publishedAt || a.submittedAt
          );
          const dateB = new Date(
            activeTab === "pending"
              ? b.submittedAt
              : b.publishedAt || b.submittedAt
          );
          return dateB.getTime() - dateA.getTime();
      }
    });

    return filtered;
  }, [activeTab, pendingGames, publishedGames, searchTerm, sortBy]);

  const handleSelectGame = (gameId: string, checked: boolean) => {
    const newSelected = new Set(selectedGames);
    if (checked) {
      newSelected.add(gameId);
    } else {
      newSelected.delete(gameId);
    }
    setSelectedGames(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGames(new Set(filteredGames.map((g) => g._id)));
    } else {
      setSelectedGames(new Set());
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGameDetailInfo = (game: GameData) => {
    const details = [];
    if (game.subject) details.push(`Môn: ${game.subject}`);
    if (game.grade) details.push(`Lớp: ${game.grade}`);
    if (game.gameType) details.push(`Loại: ${game.gameType}`);
    if (game.buildSize) details.push(`Size: ${formatFileSize(game.buildSize)}`);
    return details;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Chờ QC</p>
              <p className="text-xl font-bold text-orange-600">
                {pendingGames.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Đã xuất bản</p>
              <p className="text-xl font-bold text-green-600">
                {publishedGames.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Re-test</p>
              <p className="text-xl font-bold text-amber-600">
                {pendingGames.filter((g) => g.isRetest).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
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
            </div>
            <div>
              <p className="text-sm text-slate-500">Đã chọn</p>
              <p className="text-xl font-bold text-blue-600">
                {selectedGames.size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "pending"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Chờ QC ({pendingGames.length})
          </button>
          <button
            onClick={() => setActiveTab("published")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "published"
                ? "border-green-500 text-green-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Đã xuất bản ({publishedGames.length})
          </button>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm game, tác giả, môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sắp xếp theo ngày</option>
              <option value="title">Sắp xếp theo tên</option>
              <option value="owner">Sắp xếp theo tác giả</option>
            </select>

            <div className="flex border border-slate-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 text-sm ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 text-sm ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
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
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedGames.size > 0 && (isQC || isAdmin) && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              Đã chọn {selectedGames.size} game
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkReview("pass")}
                disabled={bulkProcessing}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {bulkProcessing ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                Pass hàng loạt
              </button>
              <button
                onClick={() => handleBulkReview("fail")}
                disabled={bulkProcessing}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {bulkProcessing ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                Fail hàng loạt
              </button>
              <button
                onClick={() => setSelectedGames(new Set())}
                disabled={bulkProcessing}
                className="px-3 py-1 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300 disabled:opacity-50"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Games Display */}
      {filteredGames.length > 0 ? (
        viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <div
                key={game._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Game Thumbnail */}
                <div className="relative aspect-video bg-slate-100">
                  {game.thumbnailDesktop ? (
                    <Image
                      src={game.thumbnailDesktop}
                      alt={game.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-slate-400"
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
                    </div>
                  )}

                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedGames.has(game._id)}
                      onChange={(e) =>
                        handleSelectGame(game._id, e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 bg-white border-2 border-white rounded focus:ring-blue-500 shadow-sm"
                    />
                  </div>

                  {/* Status badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <StatusChip status={game.status} />
                    {game.isRetest && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                        Re-test
                      </span>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="text-sm text-slate-500 font-mono">
                      {game.gameId}
                    </p>
                  </div>

                  <div className="space-y-1 mb-3">
                    {getGameDetailInfo(game).map((detail, index) => (
                      <p key={index} className="text-xs text-slate-600">
                        {detail}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>v{game.version}</span>
                    <span>{game.ownerName}</span>
                  </div>

                  <div className="text-xs text-slate-500 mb-3">
                    {activeTab === "pending" ? (
                      <>Gửi: {formatDate(game.submittedAt)}</>
                    ) : (
                      <>
                        Xuất bản:{" "}
                        {formatDate(game.publishedAt || game.submittedAt)}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {activeTab === "pending" ? (
                      <Link
                        href={`/console/games/${game._id}/review?versionId=${game.versionId}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        Review QC
                      </Link>
                    ) : (
                      <Link
                        href={`/play/${game._id}`}
                        target="_blank"
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        Chơi game
                      </Link>
                    )}
                    <Link
                      href={`/console/games/${game._id}`}
                      className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Mobile-friendly table header */}
            <div className="hidden md:block">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={
                      filteredGames.length > 0 &&
                      selectedGames.size === filteredGames.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-12 gap-4 flex-1 text-sm font-semibold text-slate-700">
                    <div className="col-span-4">Game</div>
                    <div className="col-span-2">Version</div>
                    <div className="col-span-2">Tác giả</div>
                    <div className="col-span-2">Ngày</div>
                    <div className="col-span-1">QC</div>
                    <div className="col-span-1">Thao tác</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredGames.map((game) => (
                <div
                  key={game._id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedGames.has(game._id)}
                      onChange={(e) =>
                        handleSelectGame(game._id, e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1"
                    />

                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {game.thumbnailDesktop ? (
                        <Image
                          src={game.thumbnailDesktop}
                          alt={game.title}
                          width={64}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-slate-400"
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
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 line-clamp-1">
                            {game.title}
                          </h3>
                          <p className="text-sm text-slate-500 font-mono">
                            {game.gameId}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <StatusChip status={game.status} />
                          {game.isRetest && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                              Re-test
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details for mobile */}
                      <div className="md:hidden space-y-1 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Version:</span>
                          <span className="font-mono">v{game.version}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Tác giả:</span>
                          <span>{game.ownerName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            {activeTab === "pending" ? "Gửi:" : "Xuất bản:"}
                          </span>
                          <span>
                            {formatDate(
                              activeTab === "pending"
                                ? game.submittedAt
                                : game.publishedAt || game.submittedAt
                            )}
                          </span>
                        </div>
                        {getGameDetailInfo(game).length > 0 && (
                          <div className="text-xs text-slate-500 mt-2">
                            {getGameDetailInfo(game).join(" • ")}
                          </div>
                        )}
                      </div>

                      {/* Desktop grid layout */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <div className="space-y-1">
                            {getGameDetailInfo(game)
                              .slice(0, 2)
                              .map((detail, index) => (
                                <p
                                  key={index}
                                  className="text-xs text-slate-600"
                                >
                                  {detail}
                                </p>
                              ))}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="font-mono text-sm">
                            v{game.version}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">{game.ownerName}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">
                            {formatDate(
                              activeTab === "pending"
                                ? game.submittedAt
                                : game.publishedAt || game.submittedAt
                            )}
                          </span>
                        </div>
                        <div className="col-span-1">
                          {game.qcAttempts > 0 ? (
                            <span className="text-xs text-amber-600 font-medium">
                              #{game.qcAttempts + 1}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600">Đầu</span>
                          )}
                        </div>
                        <div className="col-span-1">
                          {/* Actions handled below */}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {activeTab === "pending" ? (
                          <Link
                            href={`/console/games/${game._id}/review?versionId=${game.versionId}`}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            Review QC
                          </Link>
                        ) : (
                          <Link
                            href={`/play/${game._id}`}
                            target="_blank"
                            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                          >
                            Chơi game
                          </Link>
                        )}
                        <Link
                          href={`/console/games/${game._id}`}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200 transition-colors"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            {activeTab === "pending" ? (
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {activeTab === "pending"
              ? searchTerm
                ? "Không tìm thấy game nào"
                : "Không có game nào đang chờ QC"
              : searchTerm
              ? "Không tìm thấy game nào"
              : "Chưa có game nào được xuất bản"}
          </h3>
          <p className="text-slate-500">
            {activeTab === "pending"
              ? "Các game đã được dev submit sẽ xuất hiện ở đây để bạn review."
              : "Các game đã được QC pass và xuất bản sẽ xuất hiện ở đây."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}
