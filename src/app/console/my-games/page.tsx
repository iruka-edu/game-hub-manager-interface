"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useAuth";
import { useGames } from "@/features/games/hooks/useGames";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";

const GCSManagement = dynamic(
  () =>
    import("@/features/gcs/components/GCSManagement").then((mod) => ({
      default: mod.GCSManagement,
    })),
  {
    loading: () => (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    ),
    ssr: false, // GCS management likely uses browser APIs
  },
);

// Status configurations
const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  qc_failed: "QC cần sửa",
  uploaded: "Đang chờ QC",
  qc_processing: "Đang QC",
  qc_passed: "QC đạt - Chờ duyệt",
  approved: "Đã duyệt - Chờ xuất bản",
  published: "Đã xuất bản",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  uploaded: "bg-blue-100 text-blue-700",
  qc_processing: "bg-yellow-100 text-yellow-700",
  qc_passed: "bg-green-100 text-green-700",
  qc_failed: "bg-red-100 text-red-700",
  approved: "bg-purple-100 text-purple-700",
  published: "bg-emerald-100 text-emerald-700",
};

export default function MyGamesPage() {
  const searchParams = useSearchParams();
  // Note: Middleware handles auth redirect, no need for useEffect
  const { user, isLoading: sessionLoading } = useSession();
  const { games, isLoading: gamesLoading, isError } = useGames();

  const statusFilter = searchParams.get("status") || "";
  const currentTab = searchParams.get("tab") || "games";

  // Note: useGames hook defaults to mine=true via store's initialFilters

  const hasRole = (role: string) =>
    (user?.roles as string[] | undefined)?.includes(role) ?? false;
  const isAdmin = hasRole("admin");

  // Group games by status
  const groupedGames = useMemo(() => {
    const groups: Record<string, typeof games> = {
      draft: [],
      qc_failed: [],
      uploaded: [],
      qc_processing: [],
      qc_passed: [],
      approved: [],
      published: [],
    };

    games.forEach((game) => {
      // Note: We need to fetch version status from game detail
      // For now, just show all games without grouping
      const status = game.live_version_id ? "published" : "draft";
      if (groups[status]) {
        groups[status].push(game);
      }
    });

    return groups;
  }, [games]);

  // Filter games
  const filteredGames = useMemo(() => {
    if (!statusFilter) return games;
    return groupedGames[statusFilter] || [];
  }, [games, groupedGames, statusFilter]);

  const breadcrumbItems = [
    { label: "Console", href: "/console" },
    { label: "Game của tôi" },
  ];

  // Loading state
  if (sessionLoading || gamesLoading) {
    return (
      <div className="p-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="animate-pulse space-y-4 mt-8">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded mt-8"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-8">
          <p className="text-red-700">
            Không thể tải dữ liệu. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Game của tôi</h1>
          <p className="text-slate-500 mt-1">
            Quản lý các game bạn đang phát triển
          </p>
        </div>
        <Link
          href="/upload"
          className="btn-primary flex items-center gap-2 min-h-[40px] px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tạo game mới
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
        <Link
          href="/console/my-games?tab=games"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            currentTab === "games"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <svg
            className="w-4 h-4 mr-2 inline"
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
          Danh sách game
        </Link>
        {isAdmin && (
          <Link
            href="/console/my-games?tab=gcs"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === "gcs"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <svg
              className="w-4 h-4 mr-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            Quản lý GCS
          </Link>
        )}
      </div>

      {/* Games Tab Content */}
      {currentTab === "games" && (
        <>
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/console/my-games?tab=games"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !statusFilter
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({games.length})
            </Link>
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const count = groupedGames[status]?.length || 0;
              if (count === 0) return null;
              return (
                <Link
                  key={status}
                  href={`/console/my-games?tab=games&status=${status}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? STATUS_COLORS[status] || "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label} ({count})
                </Link>
              );
            })}
          </div>

          {filteredGames.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Game
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Trạng thái
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Ngày tạo
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGames.map((game) => {
                    const status = game.live_version_id ? "published" : "draft";
                    return (
                      <tr
                        key={game.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/console/games/${game.id}`}
                            className="block"
                          >
                            <p className="font-medium text-slate-900 hover:text-indigo-600">
                              {game.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {game.game_id}
                            </p>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[status] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {STATUS_LABELS[status] || status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(game.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/console/games/${game.id}`}
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={
                statusFilter
                  ? `Không có game nào ở trạng thái "${STATUS_LABELS[statusFilter]}"`
                  : "Bạn chưa có game nào"
              }
              description={
                statusFilter
                  ? "Thử chọn bộ lọc khác hoặc tạo game mới"
                  : "Bắt đầu bằng cách tạo game đầu tiên của bạn"
              }
              icon="game"
              action={
                statusFilter
                  ? undefined
                  : { label: "Tạo game đầu tiên", href: "/upload" }
              }
            />
          )}
        </>
      )}

      {/* GCS Management Tab */}
      {currentTab === "gcs" && <GCSManagement isAdmin={isAdmin} />}
    </div>
  );
}
