/**
 * Games API - Get Games
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiGet } from "@/lib/api-fetch";
import type { GamesListResponse, GameDetailResponse } from "../types";

export interface GetGamesParams {
  skip?: number;
  limit?: number;
  mine?: boolean;
  include_deleted?: boolean;
  // New filters
  level?: string;
  skills?: string[];
  themes?: string[];
  status?: string;
  publishState?: string;
  title?: string;
  gameId?: string;
  ownerId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Fetch games list with optional filters
 * GET /api/v1/games/list
 */
export async function getGames(
  params?: GetGamesParams,
): Promise<GamesListResponse> {
  // Convert Dates to ISO string if present
  const queryParams: Record<string, any> = {
    skip: params?.skip,
    limit: params?.limit,
    mine: params?.mine,
    include_deleted: params?.include_deleted,
    level: params?.level,
    skills: params?.skills,
    themes: params?.themes,
    status: params?.status,
    publishState: params?.publishState,
    title: params?.title,
    gameId: params?.gameId,
    ownerId: params?.ownerId,
    sortBy: params?.sortBy,
    sortOrder: params?.sortOrder,
  };

  if (params?.createdFrom)
    queryParams.createdFrom = params.createdFrom.toISOString();
  if (params?.createdTo) queryParams.createdTo = params.createdTo.toISOString();
  if (params?.updatedFrom)
    queryParams.updatedFrom = params.updatedFrom.toISOString();
  if (params?.updatedTo) queryParams.updatedTo = params.updatedTo.toISOString();

  return apiGet<GamesListResponse>("/api/v1/games/list", queryParams);
}

/**
 * Fetch single game detail
 * GET /api/v1/games/{game_id}
 */
export async function getGameById(gameId: string): Promise<GameDetailResponse> {
  return apiGet<GameDetailResponse>(`/api/v1/games/${gameId}`);
}

/**
 * Check if gameId is duplicate
 * GET /api/v1/games/check-duplicate
 */
export async function checkDuplicateGameId(
  gameId: string,
): Promise<{ duplicate: boolean }> {
  return apiGet<{ duplicate: boolean }>("/api/v1/games/check-duplicate", {
    gameId,
  });
}
/**
 * Fetch QC Test History
 * GET /api/v1/qc/history
 */
export async function getQCReports(
  gameId: string,
  versionId?: string,
): Promise<any[]> {
  return apiGet<any[]>("/api/v1/qc/history", { gameId, versionId });
}
