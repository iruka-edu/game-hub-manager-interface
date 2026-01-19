"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth";
import {
  useGames,
  useApproveGame,
  useRejectGame,
  usePublishGame,
} from "@/features/games";
import { GameListItem } from "@/features/games/types";
import { StatusChip } from "@/components/ui/StatusChip";

interface GameApprovalItem {
  _id: string;
  gameId: string;
  title: string;
  ownerName: string;
  updatedAt: string;
}

export default function ApprovalPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();
  const { games, isLoading: gamesLoading, isError } = useGames();
  const approveMutation = useApproveGame();
  const rejectMutation = useRejectGame();
  const publishMutation = usePublishGame();

  // Authorization check - only CTO, CEO, admin can approve
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/login?redirect=/console/approval");
      return;
    }

    if (user) {
      const canApprove =
        user.roles.includes("cto") ||
        user.roles.includes("ceo") ||
        user.roles.includes("admin");
      if (!canApprove) {
        router.push("/console");
      }
    }
  }, [user, isAuthenticated, sessionLoading, router]);

  // Filter games that need approval (have qc_passed status)
  // Note: Current API doesn't return version status in list, so we approximate
  // Filter games that need approval (have qc_passed status)
  // Note: Current API doesn't return version status in list, so we approximate
  const gamesWithOwner: GameApprovalItem[] = useMemo(() => {
    // For now, show games without live version as pending approval
    return games
      .filter((g: GameListItem) => !g.live_version_id)
      .map((game: GameListItem) => ({
        _id: game.id,
        gameId: game.game_id,
        title: game.title,
        ownerName: "Developer", // API doesn't include owner info in list
        updatedAt: game.created_at,
      }));
  }, [games]);

  // Stats
  const approvedCount = 0; // Would need version status
  const publishedThisMonth = games.filter((g) => {
    if (!g.published_at) return false;
    const pubDate = new Date(g.published_at);
    const now = new Date();
    return (
      pubDate.getMonth() === now.getMonth() &&
      pubDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const handleApprove = async (gameId: string) => {
    try {
      await approveMutation.mutateAsync({
        gameId,
        payload: { decision: "approve" },
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleReject = async (gameId: string) => {
    try {
      await rejectMutation.mutateAsync({
        gameId,
        payload: {
          decision: "reject",
          note: "Rejected from approval page",
        },
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  // Loading state
  if (sessionLoading || gamesLoading) {
    return (
      <div className="p-8">
        <nav className="flex items-center gap-2 text-sm mb-6">
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
          <span className="text-slate-900 font-medium">Chờ duyệt</span>
        </nav>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-200"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-8">
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link href="/console" className="text-slate-500 hover:text-slate-900">
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
          <span className="text-slate-900 font-medium">Chờ duyệt</span>
        </nav>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700">
            Không thể tải dữ liệu. Vui lòng thử lại.
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
        <span className="text-slate-900 font-medium">Chờ duyệt</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Game chờ duyệt</h1>
        <p className="text-slate-500 mt-1">
          Các game đã qua QC và đang chờ phê duyệt để xuất bản
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <p className="text-sm text-slate-500">QC đạt - Chờ duyệt</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {gamesWithOwner.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <p className="text-sm text-slate-500">Đã duyệt (chờ publish)</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {approvedCount}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <p className="text-sm text-slate-500">Xuất bản tháng này</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {publishedThisMonth}
          </p>
        </div>
      </div>

      {gamesWithOwner.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Game
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Dev phụ trách
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Kết quả QC
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Ngày QC
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gamesWithOwner.map((game) => (
                <tr
                  key={game._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link href={`/console/games/${game._id}`} className="block">
                      <p className="font-medium text-slate-900 hover:text-indigo-600">
                        {game.title || game.gameId}
                      </p>
                      <p className="text-sm text-slate-500">{game.gameId}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {game.ownerName}
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip status="qc_passed" size="sm" />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(game.updatedAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(game._id)}
                        disabled={approveMutation.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(game._id)}
                        disabled={approveMutation.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
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
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
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
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Không có game nào chờ duyệt
          </h3>
          <p className="text-slate-500">Tất cả game đã được xử lý.</p>
        </div>
      )}
    </div>
  );
}
