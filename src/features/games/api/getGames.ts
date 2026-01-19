/**
 * Games API - Get Games
 * Pure functions for fetching games data from external API
 */

import { externalApiGet } from "@/lib/external-api";
import type { GamesListResponse, GameDetailResponse } from "../types";

export interface GetGamesParams {
  skip?: number;
  limit?: number;
  mine?: boolean;
  include_deleted?: boolean;
}

/**
 * Fetch games list with optional filters
 * GET /api/v1/games/list
 */
export async function getGames(
  params?: GetGamesParams
): Promise<GamesListResponse> {
  return externalApiGet<GamesListResponse>("/api/v1/games/list", {
    skip: params?.skip,
    limit: params?.limit,
    mine: params?.mine,
    include_deleted: params?.include_deleted,
  });
}

/**
 * Fetch single game detail
 * GET /api/v1/games/{game_id}
 */
export async function getGameById(gameId: string): Promise<GameDetailResponse> {
  return externalApiGet<GameDetailResponse>(`/api/v1/games/${gameId}`);
}

/**
 * Check if gameId is duplicate
 * GET /api/v1/games/check-duplicate
 */
export async function checkDuplicateGameId(
  gameId: string
): Promise<{ duplicate: boolean }> {
  return externalApiGet<{ duplicate: boolean }>(
    "/api/v1/games/check-duplicate",
    {
      gameId,
    }
  );
}
