"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/features/auth/hooks/useAuth";
import { useGames } from "@/features/games/hooks/useGames";
import { GameListItem } from "@/features/games/types";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";
import { QCInboxClient } from "./QCInboxClient";

export default function QCInboxPage() {
  const { user, isLoading: sessionLoading } = useSession();

  // Fetch all games across system for QC management
  const { games: allGamesData, isLoading: gamesLoading } = useGames({
    status: "qc", // Fetch all statuses
    mine: false, // All games, not just mine
    ownerId: "all",
  });

  // Loading state
  if (sessionLoading || gamesLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-4 bg-slate-200 rounded w-full max-w-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-xl mt-8"></div>
        </div>
      </div>
    );
  }

  // Permission check
  const userRoles = (user?.roles || []) as any[];
  if (!user || (!userRoles.includes("admin") && !userRoles.includes("qc"))) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center max-w-2xl mx-auto mt-12">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Truy cập bị chặn</h2>
          <p className="text-slate-500 mt-2">
            Bạn không có quyền truy cập màn Chờ kiểm tra. Vui lòng liên hệ quản
            trị viên.
          </p>
          <button
            onClick={() => (window.location.href = "/console")}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
          >
            Quay về Console
          </button>
        </div>
      </div>
    );
  }

  // Map all games for internal QC data structure
  const allGames = allGamesData.map((g) => {
    const game = g as any;
    return {
      _id: game.id,
      gameId: game.game_id,
      title: game.title,
      description: game.description || undefined,
      subject: game.subject || undefined,
      grade: game.grade || undefined,
      gameType: game.game_type || undefined,
      thumbnailDesktop: game.thumbnail_desktop || undefined,
      thumbnailMobile: game.thumbnail_mobile || undefined,
      version: game.version || "1.0.0",
      versionId: game.last_version_id || "",
      liveVersionId: game.live_version_id || null,
      status: (game.status || "draft") as any,
      createdAt: game.created_at,
      updatedAt: game.updated_at,
      ownerName: game.owner_displayName || game.owner_id || "Developer",
      qcIssues: game.qc_issues || [],
      tags: {
        level: game.level,
        interest: game.interest,
        skills: game.skills,
        themes: game.themes,
      },
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <nav className="flex items-center gap-2 text-sm mb-2">
            <span className="text-slate-500">Console</span>
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
            <span className="font-medium text-slate-900">QC Inbox</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
              Chờ kiểm tra (QC Inbox)
            </h1>
            <p className="text-slate-500 mt-1">
              Hộp thư công việc của bộ phận kiểm tra chất lượng
            </p>
          </div>
        </div>

        <QCInboxClient allGames={allGames} userRoles={user?.roles || []} />
      </div>
    </div>
  );
}
