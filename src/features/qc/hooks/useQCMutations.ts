"use client";

/**
 * useQCMutations Hook
 * React Query mutations for QC operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitQCDecision, submitTestRun } from "../api/qcMutations";
import { gamesKeys } from "@/features/games";
import type { QCDecisionPayload, QCRunPayload } from "../types";

/**
 * Hook for submitting QC decision
 */
export function useSubmitQCDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gameId,
      decision,
    }: {
      gameId: string;
      decision: QCDecisionPayload;
    }) => submitQCDecision(decision),
    onSuccess: (_, { gameId }) => {
      // Invalidate games list and detail
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gamesKeys.detail(gameId),
      });
    },
  });
}

/**
 * Hook for submitting test run results
 */
export function useSubmitTestRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gameId,
      testRun,
    }: {
      gameId: string;
      testRun: QCRunPayload;
    }) => submitTestRun(testRun),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({
        queryKey: gamesKeys.detail(gameId),
      });
    },
  });
}
