"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/features/auth/hooks/useAuth";
import { useGames } from "@/features/games/hooks/useGames";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export default function ConsoleDashboard() {
  const router = useRouter();
  // Note: Route protection is handled by Middleware, no need for useEffect redirect
  const { user, isLoading: sessionLoading } = useSession();
  const { games, allGames, isLoading: gamesLoading } = useGames();

  // Redirect if user doesn't have dashboard access
  useEffect(() => {
    if (!sessionLoading && user) {
      const userRoles = user.roles as any[];

      if (!hasPermission(userRoles, PERMISSIONS.VIEW_DASHBOARD)) {
        // Redirect to appropriate page based on role
        if (hasPermission(userRoles, PERMISSIONS.VIEW_MY_GAMES)) {
          router.push("/console/my-games");
        } else if (hasPermission(userRoles, PERMISSIONS.VIEW_QC_INBOX)) {
          router.push("/console/qc-inbox");
        } else if (hasPermission(userRoles, PERMISSIONS.VIEW_REVIEW_QUEUE)) {
          router.push("/console/approval");
        } else if (hasPermission(userRoles, PERMISSIONS.VIEW_PUBLISH_QUEUE)) {
          router.push("/console/publish");
        } else if (hasPermission(userRoles, PERMISSIONS.VIEW_GAME_LIBRARY)) {
          router.push("/console/library");
        }
      }
    }
  }, [user, sessionLoading, router]);

  // Compute stats from games
  const stats = useMemo(() => {
    const myGames = games.length;
    let pendingQC = 0;
    let pendingApproval = 0;
    let published = 0;

    // Note: Current API returns GameListItem which doesn't have version status
    // We approximate using live_version_id presence
    games.forEach((game) => {
      if (game.live_version_id) {
        published++;
      }
    });

    // For a proper implementation, we'd need an API that returns version status
    // For now, show what we can compute
    return {
      totalGames: allGames.length,
      myGames,
      pendingQC,
      pendingApproval,
      published,
    };
  }, [games, allGames]);

  const hasRole = (role: string) =>
    (user?.roles as string[] | undefined)?.includes(role) ?? false;
  const isAdmin = hasRole("admin");
  const isDev = hasRole("dev");
  const isQC = hasRole("qc");
  const isCTO = hasRole("cto");
  const isCEO = hasRole("ceo");

  // Loading state
  if (sessionLoading || gamesLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="mb-6 sm:mb-8">
          <div className="h-8 bg-slate-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-48 mt-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6"
            >
              <div className="h-12 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    // This should not happen since Middleware protects the route
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Tổng quan
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Xin chào, {user.full_name || user.email}!
        </p>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {(isDev || isAdmin) && (
          <Link
            href="/console/my-games"
            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.myGames}
                </p>
                <p className="text-xs sm:text-sm text-slate-500">
                  Game của tôi
                </p>
              </div>
            </div>
          </Link>
        )}

        {(isQC || isAdmin) && (
          <Link
            href="/console/qc-inbox"
            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.pendingQC}
                </p>
                <p className="text-xs sm:text-sm text-slate-500">Chờ QC</p>
              </div>
            </div>
          </Link>
        )}

        {(isCTO || isCEO || isAdmin) && (
          <Link
            href="/console/approval"
            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
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
              <div className="flex-1 min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.pendingApproval}
                </p>
                <p className="text-xs sm:text-sm text-slate-500">Chờ duyệt</p>
              </div>
            </div>
          </Link>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.published}
              </p>
              <p className="text-xs sm:text-sm text-slate-500">Đã xuất bản</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Responsive */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
          Thao tác nhanh
        </h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          {(isDev || isAdmin) && (
            <Link
              href="/console/my-games"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base font-medium"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tạo game mới
            </Link>
          )}
          <Link
            href="/console/library"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base font-medium"
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
            Xem thư viện
          </Link>
        </div>
      </div>
    </div>
  );
}
