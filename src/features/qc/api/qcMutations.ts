/**
 * QC API Functions
 */

import { apiPost } from "@/lib/api-fetch";
import type {
  QCDecision,
  QCDecisionResponse,
  TestRunResult,
  TestRunResponse,
} from "../types";

/**
 * Submit QC decision (pass/fail)
 * POST /api/qc/decision
 */
export async function submitQCDecision(
  decision: QCDecision
): Promise<QCDecisionResponse> {
  return apiPost<QCDecisionResponse>("/api/qc/decision", decision);
}

/**
 * Submit test run results
 * POST /api/qc/run
 */
export async function submitTestRun(
  testRun: TestRunResult
): Promise<TestRunResponse> {
  return apiPost<TestRunResponse>("/api/qc/run", testRun);
}
