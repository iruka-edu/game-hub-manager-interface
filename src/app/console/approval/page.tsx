"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/features/auth/hooks/useAuth";
import { useGames } from "@/features/games/hooks/useGames";
import {
  useApproveGame,
  useRejectGame,
} from "@/features/games/hooks/useGameMutations";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";
import { StatusChip } from "@/components/ui/StatusChip";
import { GRADE_MAP, SUBJECT_MAP } from "@/lib/game-constants";

export default function ApprovalPage() {
  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();

  // 1. Fetch games in 'review' status (Waiting for decision)
  const {
    games,
    isLoading: gamesLoading,
    isError,
  } = useGames({
    status: "review",
    mine: false,
    ownerId: "all",
  });

  // 2. Fetch stats: Approved but not Published & Live this month
  const { games: approvedGames } = useGames({
    status: "approved",
    mine: false,
    ownerId: "all",
  });

  const { games: publishedGames } = useGames({
    publishState: "published",
    mine: false,
    ownerId: "all",
  });

  const approveMutation = useApproveGame();
  const rejectMutation = useRejectGame();

  // Stats calculation
  const stats = useMemo(() => {
    const waiting = games.length;

    // Approved but not live
    const approvedNotLive = approvedGames.filter(
      (g) => (g as any).publish_state !== "published",
    ).length;

    // Published this month
    const now = new Date();
    const liveMonth = publishedGames.filter((g: any) => {
      if (!g.published_at) return false;
      const pubDate = new Date(g.published_at);
      return (
        pubDate.getMonth() === now.getMonth() &&
        pubDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return { waiting, approvedNotLive, liveMonth };
  }, [games, approvedGames, publishedGames]);

  // Sort games: Newest updated first
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    });
  }, [games]);

  if (sessionLoading || gamesLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-slate-100 rounded-2xl border border-slate-200"
              ></div>
            ))}
          </div>
          <div className="h-96 bg-slate-50 rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  const userRoles = (user?.roles || []) as any[];
  if (
    !isAuthenticated ||
    !hasPermission(userRoles, PERMISSIONS.VIEW_REVIEW_QUEUE)
  ) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-rose-500"
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Truy cập bị chặn
          </h2>
          <p className="text-slate-500 mb-8">
            Bạn không có quyền truy cập vào Cổng kiểm soát nội dung (Review
            Queue). Vui lòng liên hệ Admin.
          </p>
          <Link
            href="/console"
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
          >
            Quay về Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const handleApprove = async (gameId: string) => {
    if (
      !confirm(
        "Xác nhận duyệt nội dung game này? Game sẽ chuyển sang trạng thái Approved.",
      )
    )
      return;
    try {
      await approveMutation.mutateAsync({ gameId });
    } catch (error) {
      console.error("Approve error:", error);
    }
  };

  const handleReject = async (gameId: string) => {
    const reason = prompt("Lý do từ chối quyết định duyệt:");
    if (reason === null) return;
    try {
      await rejectMutation.mutateAsync({
        gameId,
        payload: { note: reason || "Bị từ chối ở bước duyệt nội dung" },
      });
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            <Link
              href="/console"
              className="hover:text-indigo-600 transition-colors"
            >
              Console
            </Link>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-slate-900">Review Queue</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            Chờ duyệt nội dung
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Cổng kiểm soát chất lượng nội dung học liệu trước khi xuất bản
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Đang chờ xử lý
            </p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-slate-900">
                {stats.waiting}
              </span>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                Cần duyệt ngay
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Đã duyệt (Chờ Live)
            </p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-slate-900">
                {stats.approvedNotLive}
              </span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                Tồn kho
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Đưa live tháng này
            </p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-slate-900">
                {stats.liveMonth}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                Hoàn thành
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Queue List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
        {games.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5 text-left">Nội dung Game</th>
                  <th className="px-8 py-5 text-left">Học liệu (Tags)</th>
                  <th className="px-8 py-5 text-left">Trạng thái vòng đời</th>
                  <th className="px-8 py-5 text-left">QC Status</th>
                  <th className="px-8 py-5 text-right">Quyết định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedGames.map((game: any) => (
                  <tr
                    key={game.id}
                    className="group hover:bg-slate-50/80 transition-all"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative shadow-sm shrink-0">
                          {game.thumbnail_desktop ? (
                            <Image
                              src={game.thumbnail_desktop}
                              alt={game.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 text-slate-300 italic text-[8px]">
                              No-thumbnail
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/console/games/${game.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 truncate block text-base transition-colors"
                          >
                            {game.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              ID: {game.game_id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              Dev:{" "}
                              <span className="text-slate-800 font-black">
                                {game.owner_displayName || "Developer"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100">
                            {SUBJECT_MAP[game.subject] ||
                              game.subject ||
                              "Unknown"}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200">
                            {GRADE_MAP[game.grade] || game.grade || "N/A"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-bold truncate max-w-[150px]">
                          Bài:{" "}
                          <span className="text-slate-600">
                            {game.level || "Chưa gắn"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <StatusChip status={game.status} />
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                          Gửi duyệt:{" "}
                          {new Date(
                            game.updated_at || game.created_at,
                          ).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">
                          QC PASS
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <Link
                          href={`/play/${game.id}`}
                          target="_blank"
                          className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2 border border-slate-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Chơi thử
                        </Link>
                        <button
                          onClick={() => handleApprove(game.id)}
                          disabled={approveMutation.isPending}
                          className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(game.id)}
                          disabled={rejectMutation.isPending}
                          className="px-5 py-2.5 bg-white border border-slate-200 text-rose-500 font-bold text-[11px] uppercase tracking-wider rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-8 text-center bg-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border border-slate-200 animate-bounce">
              <svg
                className="w-12 h-12 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Tất cả đã xử lý xong!
            </h3>
            <p className="text-slate-500 max-w-sm mb-10 font-medium">
              Hàng chờ của bạn hiện đã trống. Mọi game đều đã được kiểm soát nội
              dung.
            </p>
            <Link
              href="/console"
              className="px-8 py-3 bg-white border border-slate-300 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              Quay về Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
