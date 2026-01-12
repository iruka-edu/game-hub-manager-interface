/**
 * Games API - Get Games
 * Pure functions for fetching games data
 */

import { apiGet } from "@/lib/api-fetch";
import type {
  GamesListResponse,
  GameFilters,
  GameDetailResponse,
} from "../types";

export interface GetGamesParams {
  status?: string;
  ownerId?: string;
  subject?: string;
  grade?: string;
  isDeleted?: boolean;
}

/**
 * Fetch games list with optional filters
 * GET /api/games/list
 */
export async function getGames(
  params?: GetGamesParams
): Promise<GamesListResponse> {
  return apiGet<GamesListResponse>("/api/games/list", {
    status: params?.status,
    ownerId: params?.ownerId,
    subject: params?.subject,
    grade: params?.grade,
    isDeleted: params?.isDeleted ? "true" : undefined,
  });
}

/**
 * Fetch single game detail
 * GET /api/games/:id
 */
export async function getGameById(gameId: string): Promise<GameDetailResponse> {
  return apiGet<GameDetailResponse>(`/api/games/${gameId}`);
}
