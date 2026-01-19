/**
 * QC API Functions
 * Calling external API at NEXT_PUBLIC_BASE_API_URL
 */

import { externalApiPost } from "@/lib/external-api";
import type {
  QCDecisionPayload,
  QCDecisionResponse,
  QCRunPayload,
  QCRunResponse,
} from "../types";

/**
 * Submit QC decision (pass/fail)
 * POST /api/v1/qc/decision
 */
export async function submitQCDecision(
  decision: QCDecisionPayload
): Promise<QCDecisionResponse> {
  return externalApiPost<QCDecisionResponse>("/api/v1/qc/decision", decision);
}

/**
 * Submit test run results
 * POST /api/v1/qc/run
 */
export async function submitTestRun(
  testRun: QCRunPayload
): Promise<QCRunResponse> {
  return externalApiPost<QCRunResponse>("/api/v1/qc/run", testRun);
}
