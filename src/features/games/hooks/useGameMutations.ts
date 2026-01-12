"use client";

/**
 * useGameMutations Hook
 * React Query mutations for game CRUD operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateGame,
  deleteGame,
  submitToQC,
  updateSelfQA,
  approveGame,
  publishGame,
  qcPass,
  qcFail,
} from "../api/gameMutations";
import { gamesKeys } from "./useGames";
import type { UpdateGamePayload } from "../types";

/**
 * Hook for updating game metadata
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
      // Invalidate both list and detail
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
    mutationFn: ({ gameId, reason }: { gameId: string; reason?: string }) =>
      deleteGame(gameId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
    },
  });
}

/**
 * Hook for submitting game to QC
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
      checklist: Array<{ id: string; checked: boolean }>;
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
    mutationFn: (gameId: string) => approveGame(gameId),
    onSuccess: (_, gameId) => {
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
    mutationFn: (gameId: string) => publishGame(gameId),
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for QC Pass
 */
export function useQCPass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, note }: { gameId: string; note?: string }) =>
      qcPass(gameId, note),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}

/**
 * Hook for QC Fail
 */
export function useQCFail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gameId,
      note,
      severity,
    }: {
      gameId: string;
      note: string;
      severity?: "low" | "medium" | "high";
    }) => qcFail(gameId, note, severity),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gamesKeys.detail(gameId) });
    },
  });
}
