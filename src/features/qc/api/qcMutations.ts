/**
 * QC API Functions
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiPost } from "@/lib/api-fetch";
import type {
  QCDecisionPayload,
  QCDecisionResponse,
  QCRunPayload,
  QCRunResponse,
  CloseIssuePayload,
  AssignIssuePayload,
} from "../types";

/**
 * Submit QC decision (pass/fail)
 * POST /api/v1/qc/decision
 */
export async function submitQCDecision(
  decision: QCDecisionPayload,
): Promise<QCDecisionResponse> {
  return apiPost<QCDecisionResponse>("/api/v1/qc/decision", decision);
}

/**
 * Submit test run results
 * POST /api/v1/qc/run
 */
export async function submitTestRun(
  testRun: QCRunPayload,
): Promise<QCRunResponse> {
  return apiPost<QCRunResponse>("/api/v1/qc/run", testRun);
}

/**
 * Close QC Issue
 * POST /api/v1/qc/issues/close
 */
export async function closeQCIssue(payload: CloseIssuePayload): Promise<void> {
  return apiPost<void>("/api/v1/qc/issues/close", payload);
}

/**
 * Assign QC Issue
 * POST /api/v1/qc/issues/assign
 */
export async function assignQCIssue(
  payload: AssignIssuePayload,
): Promise<void> {
  return apiPost<void>("/api/v1/qc/issues/assign", payload);
}
