/**
 * Audit Logs API Functions
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiGet } from "@/lib/api-fetch";
import type { AuditLogsResponse, AuditLogsParams } from "../types";

/**
 * Fetch audit logs with pagination and filters
 * GET /api/v1/audit-logs
 */
export async function getAuditLogs(
  params?: AuditLogsParams,
): Promise<AuditLogsResponse> {
  return apiGet<AuditLogsResponse>("/api/v1/audit-logs", {
    page: params?.page,
    limit: params?.limit,
    userId: params?.userId,
    action: params?.action,
    targetId: params?.targetId,
  });
}
