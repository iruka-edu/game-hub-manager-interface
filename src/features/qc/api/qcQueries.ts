/**
 * QC Queries API Functions
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiGet } from "@/lib/api-fetch";
import type { QCIssue } from "../types";

/**
 * Get QC Issues for a version
 * GET /api/v1/qc/issues/{version_id}
 */
export async function getQCIssues(versionId: string): Promise<QCIssue[]> {
  return apiGet<QCIssue[]>(`/api/v1/qc/issues/${versionId}`);
}
