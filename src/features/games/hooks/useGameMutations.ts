import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGame,
  updateGame,
  deleteGame,
  submitToQC,
  updateSelfQA,
  approveGame,
  rejectGame,
  publishGame,
  unpublishGame,
  qcReview,
  uploadBuild,
  uploadThumbnail,
} from "../api/gameMutations";
import { gamesKeys } from "./useGames";
import type {
  CreateGamePayload,
  UpdateGamePayload,
  SelfQAFlat,
} from "../types";

/**
 * Hook for creating a game
 */
export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGamePayload) => createGame(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
    },
  });
}

/**
 * Hook for updating a game
 */
export function useUpdateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gameId,
      payload,
    }: {
      gameId: string;
      payload: UpdateGamePayload;
    }) => updateGame(gameId, payload),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for deleting a game
 */
export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => deleteGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
    },
  });
}

/**
 * Hook for submitting a game to QC
 */
export function useSubmitToQC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gameId: string) => submitToQC(gameId),
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for updating Self QA checklist
 */
export function useUpdateSelfQA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gameId,
      checklist,
    }: {
      gameId: string;
      checklist: SelfQAFlat;
    }) => updateSelfQA(gameId, checklist),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for approving a game
 */
export function useApproveGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      gameId,
      payload,
    }: {
      gameId: string;
      payload?: { note?: string; decision?: "approve" };
    }) =>
      approveGame(gameId, {
        decision: "approve",
        ...payload,
      }),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for rejecting a game
 */
export function useRejectGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      gameId,
      payload,
    }: {
      gameId: string;
      payload?: { note?: string; decision?: "reject" };
    }) =>
      rejectGame(gameId, {
        decision: "reject",
        ...payload,
      }),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for publishing a game
 */
export function usePublishGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { gameId: string; payload: any }) =>
      publishGame(payload.gameId, payload.payload),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for unpublishing a game
 */
export function useUnpublishGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gameId: string) => unpublishGame(gameId),
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for uploading game build
 */
export function useUploadBuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formData,
      onUploadProgress,
    }: {
      formData: FormData;
      onUploadProgress?: (progressEvent: any) => void;
    }) => uploadBuild(formData, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
    },
  });
}

/**
 * Hook for QC Review (Pass/Fail) - wrapper around qcReview API
 */
export function useQCPass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      gameId,
      versionId,
      notes,
      qaSummary,
      reviewerName,
    }: {
      gameId: string;
      versionId: string;
      notes?: string;
      qaSummary?: Record<string, any> | null;
      reviewerName?: string | null;
    }) =>
      qcReview(gameId, {
        versionId,
        decision: "pass",
        notes,
        qaSummary,
        reviewerName,
      }),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

export function useQCFail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      gameId,
      versionId,
      notes,
      qaSummary,
      reviewerName,
    }: {
      gameId: string;
      versionId: string;
      notes?: string;
      qaSummary?: Record<string, any> | null;
      reviewerName?: string | null;
    }) =>
      qcReview(gameId, {
        versionId,
        decision: "fail",
        notes,
        qaSummary,
        reviewerName,
      }),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for uploading game thumbnails
 */
export function useUploadThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formData,
      onUploadProgress,
    }: {
      formData: FormData;
      onUploadProgress?: (progressEvent: any) => void;
    }) => uploadThumbnail(formData, onUploadProgress),
    onSuccess: (_, { formData }) => {
      // Try to get gameId from formData to invalidate detail
      const gameId = formData.get("mongoGameId") as string;
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      if (gameId) {
        queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
      }
    },
  });
}
