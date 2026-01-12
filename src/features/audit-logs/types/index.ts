/**
 * Audit Logs Feature Types
 */

import type { ActionType, TargetEntity } from "@/lib/audit-types";

/**
 * Audit log entry for client-side
 */
export interface AuditLogEntry {
  _id: string;
  actor: {
    userId: string;
    email: string;
    role: string;
    ip?: string;
    userAgent?: string;
  };
  action: ActionType;
  target: {
    entity: TargetEntity;
    id: string;
    subId?: string;
  };
  changes?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Response from GET /api/audit-logs
 */
export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Params for fetching audit logs
 */
export interface AuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: ActionType;
  targetId?: string;
}

/**
 * Filter state for audit logs
 */
export interface AuditLogFilters {
  page: number;
  limit: number;
  userId: string;
  action: ActionType | "";
  targetId: string;
}
