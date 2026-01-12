/**
 * Games Mutation API Functions
 * API functions for create, update, delete games
 */

import { apiPost, apiPut, apiDelete } from "@/lib/api-fetch";
import type { GameResponse, UpdateGamePayload } from "../types";

/**
 * Update game metadata
 * PUT /api/games/:id
 */
export async function updateGame(
  gameId: string,
  payload: UpdateGamePayload
): Promise<GameResponse> {
  return apiPut<GameResponse>(`/api/games/${gameId}`, payload);
}

/**
 * Soft delete a game
 * DELETE /api/games/:id
 */
export async function deleteGame(
  gameId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(
    `/api/games/${gameId}`,
    reason ? { reason } : undefined
  );
}

/**
 * Submit game to QC
 * POST /api/games/:id/submit-qc
 */
export async function submitToQC(gameId: string): Promise<GameResponse> {
  return apiPost<GameResponse>(`/api/games/${gameId}/submit-qc`);
}

/**
 * Self QA update
 * PUT /api/games/:id/self-qa
 */
export async function updateSelfQA(
  gameId: string,
  checklist: Array<{ id: string; checked: boolean }>
): Promise<GameResponse> {
  return apiPut<GameResponse>(`/api/games/${gameId}/self-qa`, { checklist });
}

/**
 * Approve game
 * POST /api/games/:id/approve
 */
export async function approveGame(gameId: string): Promise<GameResponse> {
  return apiPost<GameResponse>(`/api/games/${gameId}/approve`);
}

/**
 * Publish game
 * POST /api/games/:id/publish
 */
export async function publishGame(gameId: string): Promise<GameResponse> {
  return apiPost<GameResponse>(`/api/games/${gameId}/publish`);
}

/**
 * QC Review - Pass
 * POST /api/games/:id/qc-review
 */
export async function qcPass(
  gameId: string,
  note?: string
): Promise<GameResponse> {
  return apiPost<GameResponse>(`/api/games/${gameId}/qc-review`, {
    result: "pass",
    note,
  });
}

/**
 * QC Review - Fail
 * POST /api/games/:id/qc-review
 */
export async function qcFail(
  gameId: string,
  note: string,
  severity?: "low" | "medium" | "high"
): Promise<GameResponse> {
  return apiPost<GameResponse>(`/api/games/${gameId}/qc-review`, {
    result: "fail",
    note,
    severity,
  });
}
