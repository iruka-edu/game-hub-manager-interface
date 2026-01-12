"use client";

/**
 * useQCMutations Hook
 * React Query mutations for QC operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitQCDecision, submitTestRun } from "../api/qcMutations";
import { gamesKeys } from "@/features/games";
import type { QCDecision, TestRunResult } from "../types";

/**
 * Hook for submitting QC decision
 */
export function useSubmitQCDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (decision: QCDecision) => submitQCDecision(decision),
    onSuccess: (_, decision) => {
      // Invalidate games list and detail
      queryClient.invalidateQueries({ queryKey: gamesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gamesKeys.detail(decision.gameId),
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
    mutationFn: (testRun: TestRunResult) => submitTestRun(testRun),
    onSuccess: (_, testRun) => {
      queryClient.invalidateQueries({
        queryKey: gamesKeys.detail(testRun.gameId),
      });
    },
  });
}
