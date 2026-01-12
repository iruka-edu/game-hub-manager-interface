/**
 * Audit Logs API Functions
 */

import { apiGet } from "@/lib/api-fetch";
import type { AuditLogsResponse, AuditLogsParams } from "../types";

/**
 * Fetch audit logs with pagination and filters
 * GET /api/audit-logs
 */
export async function getAuditLogs(
  params?: AuditLogsParams
): Promise<AuditLogsResponse> {
  return apiGet<AuditLogsResponse>("/api/audit-logs", {
    page: params?.page,
    limit: params?.limit,
    userId: params?.userId,
    action: params?.action,
    targetId: params?.targetId,
  });
}
