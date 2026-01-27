"use client";

/**
 * useGames Hook
 * React Query hook for fetching games list
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getGames, type GetGamesParams } from "../api/getGames";
import { useGameFilters } from "../stores/useGameStore";
import type { GameListItem } from "../types";

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
  history: (gameId: string, versionId?: string) =>
    [...gamesKeys.detail(gameId), "history", versionId] as const,
};

/**
 * Hook to fetch and filter games
 */
export function useGames(overrides?: Partial<GetGamesParams>) {
  const filters = useGameFilters();

  // Build API params
  const apiParams: GetGamesParams = {
    mine: filters.mine ?? true,
    include_deleted: filters.includeDeleted ?? false,
    status: filters.status !== "all" ? filters.status : undefined,
    publishState:
      filters.publishState !== "all" ? filters.publishState : undefined,
    title: filters.search || undefined,
    ownerId: filters.ownerId !== "all" ? filters.ownerId : undefined,
    // Add date filters if needed
    level: filters.level !== "all" ? filters.level : undefined,
    skills: filters.skills !== "all" ? filters.skills : undefined,
    themes: filters.themes !== "all" ? filters.themes : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    ...overrides,
  };

  const query = useQuery({
    queryKey: gamesKeys.list(apiParams as Record<string, unknown>),
    queryFn: () => getGames(apiParams),
    staleTime: 1 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    games: query.data ?? [],
    allGames: query.data ?? [],
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
/**
 * Hook to fetch game QC history / issues
 */
export function useGameHistory(gameId: string, versionId?: string) {
  return useQuery({
    queryKey: gamesKeys.history(gameId, versionId),
    queryFn: async () => {
      const { getQCReports } = await import("../api/getGames");
      return getQCReports(gameId, versionId);
    },
    enabled: !!gameId && !!versionId,
    staleTime: 60 * 1000,
  });
}
