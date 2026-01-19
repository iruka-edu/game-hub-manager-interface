/**
 * Audit Logs API Functions
 */

import { externalApiGet } from "@/lib/external-api";
import type { AuditLogsResponse, AuditLogsParams } from "../types";

/**
 * Fetch audit logs with pagination and filters
 * GET /api/v1/audit-logs
 */
export async function getAuditLogs(
  params?: AuditLogsParams,
): Promise<AuditLogsResponse> {
  return externalApiGet<AuditLogsResponse>("/api/v1/audit-logs", {
    page: params?.page,
    limit: params?.limit,
    userId: params?.userId,
    action: params?.action,
    targetId: params?.targetId,
  });
}
