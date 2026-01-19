"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/features/auth";
import { useGameDetail } from "@/features/games";
import { GameEditForm } from "@/features/games/components/GameEditForm";

function GameEditContent() {
  const params = useParams();
  const id = params.id as string;

  const { user, isLoading: sessionLoading } = useSession();
  const { data: game, isLoading: gameLoading } = useGameDetail(id);

  // Loading
  if (sessionLoading || gameLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Auth/Role Check
  if (!user) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">Lỗi xác thực</h2>
          <p className="text-red-600 mt-2">Không thể xác thực người dùng.</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Game không tồn tại
          </h2>
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

  const isOwner = game.owner_id === user.id;
  const isAdmin = user.roles?.includes("admin");

  if (!isOwner && !isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Không có quyền truy cập
          </h2>
          <p className="text-red-600 mt-2">
            Bạn không có quyền chỉnh sửa game này.
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

  // Note: Skipping strict status check "draft"|"qc_failed" as API doesn't return version status easily yet
  // We assume if user accessed this page, they intend to edit.

  // Serialize game data for client component
  const gameData = {
    _id: game.id,
    gameId: game.game_id,
    title: game.title || "",
    description: game.description || "",
    subject: "",
    grade: "",
    unit: "",
    gameType: "",
    lesson: game.meta_data?.lesson || [],
    level: "",
    skills: game.meta_data?.skills || [],
    themes: game.meta_data?.themes || [],
    linkGithub: game.github_link || "",
    quyenSach: "",
    thumbnailDesktop: game.meta_data?.thumbnail?.desktop || "",
    thumbnailMobile: game.meta_data?.thumbnail?.mobile || "",
    metadata: undefined,
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/console/games/${id}`}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-2 inline-block"
        >
          ← Quay lại chi tiết game
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Sửa thông tin game
        </h1>
        <p className="text-slate-500 mt-1">Game ID: {game.game_id}</p>
      </div>

      <GameEditForm game={gameData} />
    </div>
  );
}

export default function GameEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameEditContent />
    </Suspense>
  );
}
