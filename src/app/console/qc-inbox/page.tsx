"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/features/auth";
import { useGames, useGameFilterActions } from "@/features/games";
import { QCInboxClient } from "./QCInboxClient";

export default function QCInboxPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const { games, isLoading: gamesLoading } = useGames();
  const { setMine, setOwnerId } = useGameFilterActions();

  // Reset filters to show all games (not just "mine")
  useEffect(() => {
    setMine(false);
    setOwnerId("all");
  }, [setMine, setOwnerId]);

  // Loading state
  if (sessionLoading || gamesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Authorization check - only QC and admin can view
  const isQC = user?.roles?.includes("qc");
  const isAdmin = user?.roles?.includes("admin");

  if (!user || (!isQC && !isAdmin)) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto mt-10">
          <h2 className="text-lg font-semibold text-red-700">
            Không có quyền truy cập
          </h2>
          <p className="text-red-600 mt-2">
            Bạn không có quyền truy cập QC Inbox.
          </p>
          <Link
            href="/console"
            className="inline-block mt-4 text-sm text-red-600 hover:text-red-700 underline"
          >
            ← Quay về Console
          </Link>
        </div>
      </div>
    );
  }

  // Transform games to QCInboxClient format
  // Pending = Not Live AND (Status Uploaded or just created)
  // Published = Live Version ID exists
  // Casting to 'any' to avoid missing property errors (last_version_id, updated_at, is_deleted) which are not in GameListItem type but might be present or handled gracefully

  const pendingGames = games
    .filter((g) => {
      const game = g as any;
      return !game.live_version_id && !game.is_deleted;
    })
    .map((g) => {
      const game = g as any;
      return {
        _id: game.id,
        gameId: game.game_id,
        title: game.title,
        description: game.description || undefined,
        subject: undefined,
        grade: undefined,
        gameType: undefined,
        thumbnailDesktop: undefined,
        thumbnailMobile: undefined,
        version: "1.0.0",
        versionId: game.last_version_id || "",
        status: "uploaded" as any,
        submittedAt: game.updated_at || game.created_at,
        publishedAt: undefined,
        ownerName: game.owner_id || "Developer",
        qcAttempts: 0,
        isRetest: false,
        buildSize: undefined,
        selfQAChecklist: undefined,
      };
    });

  const publishedGames = games
    .filter((g) => {
      const game = g as any;
      return game.live_version_id && !game.is_deleted;
    })
    .map((g) => {
      const game = g as any;
      return {
        _id: game.id,
        gameId: game.game_id,
        title: game.title,
        description: game.description || undefined,
        subject: undefined,
        grade: undefined,
        gameType: undefined,
        thumbnailDesktop: undefined,
        thumbnailMobile: undefined,
        version: "1.0.0",
        versionId: game.live_version_id || "",
        status: "published" as any,
        submittedAt: game.created_at,
        publishedAt: game.published_at || undefined,
        ownerName: game.owner_id || "Developer",
        qcAttempts: 1,
        isRetest: false,
        buildSize: undefined,
        selfQAChecklist: undefined,
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
            <h1 className="text-2xl font-bold text-slate-900">QC Inbox</h1>
            <p className="text-slate-500 mt-1">
              Quản lý và duyệt các game được gửi lên
            </p>
          </div>
        </div>

        <QCInboxClient
          pendingGames={pendingGames}
          publishedGames={publishedGames}
          userRoles={user?.roles || []}
        />
      </div>
    </div>
  );
}
