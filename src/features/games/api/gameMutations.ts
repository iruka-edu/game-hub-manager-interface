/**
 * Games Mutation API Functions
 * API functions for create, update, delete games via external API
 */

import {
  externalApiPost,
  externalApiPut,
  externalApiDelete,
  externalApiUpload,
} from "@/lib/external-api";
import type {
  Game,
  GameCreateResponse,
  CreateGamePayload,
  UpdateGamePayload,
  ApprovePayload,
  PublishPayload,
  SelfQAChecklist,
  QCReviewPayload,
  SelfQAResponse,
} from "../types";

/**
 * Create a new game
 * POST /api/v1/games/create
 */
export async function createGame(
  payload: CreateGamePayload,
): Promise<GameCreateResponse> {
  return externalApiPost<GameCreateResponse>("/api/v1/games/create", payload);
}

/**
 * Update game metadata
 * PUT /api/v1/games/{game_id}
 */
export async function updateGame(
  gameId: string,
  payload: UpdateGamePayload,
): Promise<Game> {
  return externalApiPut<Game>(`/api/v1/games/${gameId}`, payload);
}

/**
 * Soft delete a game
 * DELETE /api/v1/games/{game_id}
 */
export async function deleteGame(
  gameId: string,
  reason?: string,
): Promise<void> {
  await externalApiDelete<void>(`/api/v1/games/${gameId}`, { reason });
}

/**
 * Submit game to QC
 * POST /api/v1/games/{game_id}/submit-qc
 */
export async function submitToQC(gameId: string): Promise<void> {
  await externalApiPost<void>(`/api/v1/games/${gameId}/submit-qc`);
}

/**
 * Update Self QA checklist
 * POST /api/v1/games/{game_id}/self-qa
 */
export async function updateSelfQA(
  gameId: string,
  checklist: SelfQAChecklist,
): Promise<SelfQAResponse> {
  return externalApiPost<SelfQAResponse>(
    `/api/v1/games/${gameId}/self-qa`,
    checklist,
  );
}

/**
 * QC Review (pass/fail)
 * POST /api/v1/games/{game_id}/qc-review
 */
export async function qcReview(
  gameId: string,
  payload: QCReviewPayload,
): Promise<void> {
  await externalApiPost<void>(`/api/v1/games/${gameId}/qc-review`, payload);
}

/**
 * Approve game
 * POST /api/v1/release/{game_id}/approve
 */
export async function approveGame(
  gameId: string,
  payload: ApprovePayload,
): Promise<void> {
  await externalApiPost<void>(`/api/v1/release/${gameId}/approve`, payload);
}

/**
 * Reject game
 * POST /api/v1/release/{game_id}/reject
 */
export async function rejectGame(
  gameId: string,
  payload: ApprovePayload,
): Promise<void> {
  await externalApiPost<void>(`/api/v1/release/${gameId}/reject`, payload);
}

/**
 * Publish game
 * POST /api/v1/release/{game_id}/publish
 */
export async function publishGame(
  gameId: string,
  payload?: PublishPayload,
): Promise<void> {
  await externalApiPost<void>(`/api/v1/release/${gameId}/publish`, payload);
}

/**
 * Upload game build
 * POST /api/v1/games/upload
 */
export async function uploadBuild(
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void,
): Promise<void> {
  await externalApiUpload<void>(
    "/api/v1/games/upload",
    formData,
    onUploadProgress,
  );
}

/**
 * Upload thumbnail
 * POST /api/v1/games/upload-thumbnail
 */
export async function uploadThumbnail(
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void,
): Promise<void> {
  await externalApiUpload<void>(
    "/api/v1/games/upload-thumbnail",
    formData,
    onUploadProgress,
  );
}

/**
 * Upload game with metadata (combined upload)
 * POST /api/v1/games/upload-with-metadata
 */
export async function uploadWithMetadata(
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void,
): Promise<void> {
  await externalApiUpload<void>(
    "/api/v1/games/upload-with-metadata",
    formData,
    onUploadProgress,
  );
}
