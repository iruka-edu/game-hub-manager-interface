"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/features/auth";
import { useGames } from "@/features/games";
import type { GameListItem } from "@/features/games/types";
import { Suspense } from "react";

interface GamePublishItem {
  _id: string;
  gameId: string;
  title: string;
  versionStatus: "approved" | "published" | "archived";
  liveVersionId?: string;
  ownerName: string;
  rolloutPercentage: number;
  disabled: boolean;
}

function PublishPageContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: sessionLoading } = useSession();
  const { allGames, isLoading: gamesLoading } = useGames();

  const statusFilter = searchParams.get("status") || "approved";

  // Transform games data for display
  const gamesWithStatus: GamePublishItem[] = useMemo(() => {
    return allGames.map((game: GameListItem) => ({
      _id: game.id,
      gameId: game.game_id,
      title: game.title,
      // Logic for status is approximate based on live_version_id
      // Ideally should come from API
      versionStatus: game.live_version_id
        ? "published"
        : game.published_at // If has published_at but no live version currently?
          ? "archived" // Just an assumption for now
          : "approved",
      liveVersionId: game.live_version_id || undefined,
      ownerName: "Developer",
      rolloutPercentage: 100,
      disabled: false,
    }));
  }, [allGames]);

  // Filter games by status
  const filteredGames = useMemo(() => {
    if (statusFilter === "approved") {
      return gamesWithStatus.filter((g) => g.versionStatus === "approved");
    } else if (statusFilter === "published") {
      return gamesWithStatus.filter((g) => g.versionStatus === "published");
    } else if (statusFilter === "archived") {
      return gamesWithStatus.filter((g) => g.versionStatus === "archived");
    }
    return [];
  }, [gamesWithStatus, statusFilter]);

  const approvedCount = gamesWithStatus.filter(
    (g) => g.versionStatus === "approved",
  ).length;
  const publishedCount = gamesWithStatus.filter(
    (g) => g.versionStatus === "published",
  ).length;
  const archivedCount = gamesWithStatus.filter(
    (g) => g.versionStatus === "archived",
  ).length;

  // Loading state
  if (sessionLoading || gamesLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-32 mb-6"></div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Middleware handles auth, but check just in case
  if (!user) {
    return null;
  }

  // Check if user has permission to access publish page
  const userRoles = user.roles as string[];
  const hasPermission = userRoles.includes("admin");

  if (!hasPermission) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Không có quyền truy cập
          </h2>
          <p className="text-red-600 mt-2">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link
          href="/console"
          className="text-slate-500 hover:text-slate-900 transition-colors"
        >
          Console
        </Link>
        <svg
          className="w-4 h-4 text-slate-300"
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
        <span className="text-slate-900 font-medium">Quản lý xuất bản</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý xuất bản</h1>
        <p className="text-slate-500 mt-1">
          Xuất bản game ra ngoài cho học sinh sử dụng
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/console/publish?status=approved"
          className={`bg-white rounded-xl p-6 border-2 transition-all ${
            statusFilter === "approved"
              ? "border-emerald-500"
              : "border-slate-200 hover:border-emerald-300"
          }`}
        >
          <p className="text-sm text-slate-500">Chờ xuất bản</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {approvedCount}
          </p>
        </Link>
        <Link
          href="/console/publish?status=published"
          className={`bg-white rounded-xl p-6 border-2 transition-all ${
            statusFilter === "published"
              ? "border-green-500"
              : "border-slate-200 hover:border-green-300"
          }`}
        >
          <p className="text-sm text-slate-500">Đang xuất bản</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {publishedCount}
          </p>
        </Link>
        <Link
          href="/console/publish?status=archived"
          className={`bg-white rounded-xl p-6 border-2 transition-all ${
            statusFilter === "archived"
              ? "border-gray-500"
              : "border-slate-200 hover:border-gray-300"
          }`}
        >
          <p className="text-sm text-slate-500">Đã lưu trữ</p>
          <p className="text-3xl font-bold text-gray-600 mt-1">
            {archivedCount}
          </p>
        </Link>
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
                  Rollout
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Dev
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGames.map((game) => (
                <tr
                  key={game._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link href={`/console/games/${game._id}`} className="block">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 hover:text-indigo-600">
                          {game.title || game.gameId}
                        </p>
                        {game.disabled && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{game.gameId}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {game.rolloutPercentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {game.ownerName}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/console/games/${game._id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            {statusFilter === "approved"
              ? "Không có game nào chờ xuất bản"
              : statusFilter === "published"
                ? "Chưa có game nào được xuất bản"
                : "Không có game nào đã lưu trữ"}
          </h3>
        </div>
      )}
    </div>
  );
}

export default function PublishPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      }
    >
      <PublishPageContent />
    </Suspense>
  );
}
