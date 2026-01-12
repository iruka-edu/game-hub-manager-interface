"use client";

/**
 * useGames Hook
 * React Query hook for fetching games list
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getGames, type GetGamesParams } from "../api/getGames";
import { useGameFilters } from "../stores/useGameStore";
import type { Game } from "../types";

/**
 * Query key factory for games
 */
export const gamesKeys = {
  all: ["games"] as const,
  lists: () => [...gamesKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...gamesKeys.lists(), filters] as const,
  details: () => [...gamesKeys.all, "detail"] as const,
  detail: (id: string) => [...gamesKeys.details(), id] as const,
  versions: (gameId: string) =>
    [...gamesKeys.detail(gameId), "versions"] as const,
  history: (gameId: string) =>
    [...gamesKeys.detail(gameId), "history"] as const,
};

/**
 * Hook to fetch and filter games
 */
export function useGames() {
  const filters = useGameFilters();

  // Build API params from filters
  const apiParams: GetGamesParams = {
    status: filters.status !== "all" ? filters.status : undefined,
    ownerId: filters.ownerId !== "all" ? filters.ownerId : undefined,
    subject: filters.subject !== "all" ? filters.subject : undefined,
    grade: filters.grade !== "all" ? filters.grade : undefined,
    isDeleted: filters.isDeleted,
  };

  const query = useQuery({
    queryKey: gamesKeys.list(apiParams as Record<string, unknown>),
    queryFn: () => getGames(apiParams),
    staleTime: 1 * 60 * 1000, // 1 minute
    placeholderData: keepPreviousData, // Keep previous data while fetching
  });

  // Client-side search filtering (API doesn't support text search)
  const filteredGames = query.data?.games.filter((game: Game) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        game.title.toLowerCase().includes(searchLower) ||
        game.gameId.toLowerCase().includes(searchLower) ||
        (game.description?.toLowerCase().includes(searchLower) ?? false);
      if (!matchesSearch) return false;
    }
    return true;
  });

  return {
    ...query,
    games: filteredGames ?? [],
    allGames: query.data?.games ?? [],
  };
}

/**
 * Hook to fetch single game detail
 */
export function useGameDetail(gameId: string) {
  return useQuery({
    queryKey: gamesKeys.detail(gameId),
    queryFn: async () => {
      const { getGameById } = await import("../api/getGames");
      return getGameById(gameId);
    },
    enabled: !!gameId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
