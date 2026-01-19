"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/features/auth";
import { useGameDetail } from "@/features/games";
import { GamePlayer } from "./GamePlayer";
import { SerializedGame, SerializedVersion } from "@/features/games/types";

export default function PlayGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const { user, isLoading: sessionLoading } = useSession();
  const { data: game, isLoading: gameLoading, error } = useGameDetail(gameId);

  // Constants
  const BUCKET_NAME = "iruka-edu-mini-game";
  const CDN_BASE = `https://storage.googleapis.com/${BUCKET_NAME}`;

  if (sessionLoading || gameLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-xl mb-4">Vui lòng đăng nhập để chơi game</h2>
          <Link
            href={`/login?redirect=/play/${gameId}`}
            className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold mb-2">Game không tồn tại</h1>
          <p className="text-slate-400 mb-4">
            Không tìm thấy game với ID: {gameId}
          </p>
          <Link
            href="/console"
            className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
          >
            Quay lại Console
          </Link>
        </div>
      </div>
    );
  }

  // --- LOGIC TẠO URL (Updated) ---
  let gameUrl = "";

  // 1. Ưu tiên gcs_path nếu có (Admin cấu hình cứng)
  if (game.gcs_path) {
    const cleanPath = game.gcs_path.startsWith("/")
      ? game.gcs_path.slice(1)
      : game.gcs_path;
    gameUrl = `${CDN_BASE}/${cleanPath}/index.html`;
  }
  // 2. Logic chuẩn: games/{id}/{version}/index.html
  else if (game.game_id) {
    const basePath = `${CDN_BASE}/games/${game.game_id}`;

    // Logic xử lý Version:
    // Nếu có live_version_id -> dùng nó (bỏ tiền tố 'v-' nếu có)
    // Nếu KHÔNG có -> mặc định là "1.0.0"
    const rawVersion = game.live_version_id || "1.0.0";
    const cleanVersion = rawVersion.replace(/^v-/, "");

    gameUrl = `${basePath}/${cleanVersion}/index.html`;
  }

  if (!gameUrl) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold mb-2">Game chưa sẵn sàng</h1>
          <p className="text-slate-400 mb-4">Chưa có link chơi game hợp lệ.</p>
          <Link
            href="/console"
            className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
          >
            Quay lại Console
          </Link>
        </div>
      </div>
    );
  }

  // Map to SerializedGame for GamePlayer
  const serializedGame: SerializedGame = {
    _id: game.id || gameId,
    gameId: game.game_id,
    title: game.title || "Untitled Game",
    description: game.description || "",
    thumbnailDesktop: game.meta_data?.thumbnail as any,
    thumbnailMobile: undefined,
    ownerId: game.owner_id,
    teamId: game.team_id,
    latestVersionId: game.last_version_id,
    liveVersionId: game.live_version_id,
    status: (game.meta_data?.status as any) || "published",
    isDeleted: false,
    subject: game.meta_data?.subject,
    grade: game.meta_data?.grade,
    createdAt: game.created_at || new Date().toISOString(),
    updatedAt: game.updated_at || new Date().toISOString(),
  };

  // Map to SerializedVersion
  const serializedVersion: SerializedVersion = {
    _id: game.live_version_id || "v-latest",
    gameId: game.id || gameId,
    version: game.live_version_id?.replace("v-", "") || "1.0.0",
    status: "published",
    isDeleted: false,
    changelog: "",
    createdAt: game.updated_at || new Date().toISOString(),
    updatedAt: game.updated_at || new Date().toISOString(),
    createdBy: game.owner_id,
  };

  return (
    <GamePlayer
      game={serializedGame}
      version={serializedVersion}
      gameUrl={gameUrl}
      gameId={gameId}
    />
  );
}
