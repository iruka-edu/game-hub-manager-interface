"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useAuth";
import { useGames } from "@/features/games/hooks/useGames";
import { GameLibraryClient } from "./GameLibraryClient";

// Transform games from external API format to GameLibraryClient format
interface GameForLibrary {
  game: {
    _id: string;
    gameId: string;
    title: string;
    description?: string;
    thumbnailDesktop?: string;
    thumbnailMobile?: string;
    ownerId: string;
    subject?: string;
    grade?: string;
    gameType?: string;
    disabled: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    status?: string;
    publishState?: string;
  };
  latestVersion?: {
    _id: string;
    version: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  owner?: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
  };
}

export default function GameLibraryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();
  const { games, isLoading: gamesLoading, isError } = useGames({ mine: false });

  // Authorization check
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, sessionLoading, router]);

  // Loading state
  if (sessionLoading || gamesLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="aspect-308/211 bg-slate-200 animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thư viện Game</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700">
            Không thể tải dữ liệu. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  // Transform games to match GameLibraryClient expected format
  const gamesWithVersions = (games as any[]).map((game) => {
    const status = game.status || "draft";
    const publishState = game.publish_state;

    // Construct mock latestVersion if needed, or use existing if API returns it
    // The new API structure puts status on the game object
    const latestVersion = game.latest_version || {
      _id: game.last_version_id || "unknown",
      version: game.version || "1.0.0", // Fallback if no version info
      status: status,
      createdAt: game.updated_at || new Date().toISOString(),
      updatedAt: game.updated_at || new Date().toISOString(),
    };

    return {
      game: {
        _id: game.id,
        gameId: game.game_id,
        title: game.title,
        description: game.description ?? undefined,
        thumbnailDesktop: game.thumbnail_desktop ?? undefined,
        thumbnailMobile: game.thumbnail_mobile ?? undefined,
        ownerId: game.owner_id,
        subject: game.subject ?? undefined,
        grade: game.grade ?? undefined,
        gameType: game.game_type ?? undefined,
        disabled: game.disabled ?? false,
        isDeleted: game.is_deleted ?? false,
        createdAt: game.created_at ?? new Date().toISOString(),
        updatedAt: game.updated_at ?? new Date().toISOString(),
        status,
        publishState,
      },
      latestVersion,
      owner: game.owner
        ? {
            _id: game.owner.id,
            name: game.owner.name,
            email: game.owner.email,
            username: game.owner.username,
          }
        : undefined,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thư viện Game</h1>
          <p className="text-slate-500 mt-1">
            Tất cả game trong hệ thống ({gamesWithVersions.length} game)
          </p>
        </div>
      </div>

      {/* Games List */}
      <GameLibraryClient
        initialGames={gamesWithVersions}
        currentUserId={user?.id || ""}
        userRoles={user?.roles || []}
      />
    </div>
  );
}
