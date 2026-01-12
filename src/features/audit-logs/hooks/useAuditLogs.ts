"use client";

/**
 * useAuditLogs Hook
 * React Query hook for fetching audit logs
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAuditLogs } from "../api/getAuditLogs";
import { useAuditLogFilters } from "../stores/useAuditLogStore";

/**
 * Query key factory for audit logs
 */
export const auditLogsKeys = {
  all: ["auditLogs"] as const,
  lists: () => [...auditLogsKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...auditLogsKeys.lists(), filters] as const,
};

/**
 * Hook to fetch audit logs with filters from Zustand store
 */
export function useAuditLogs() {
  const filters = useAuditLogFilters();

  const query = useQuery({
    queryKey: auditLogsKeys.list({
      page: filters.page,
      limit: filters.limit,
      userId: filters.userId || undefined,
      action: filters.action || undefined,
      targetId: filters.targetId || undefined,
    }),
    queryFn: () =>
      getAuditLogs({
        page: filters.page,
        limit: filters.limit,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        targetId: filters.targetId || undefined,
      }),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    logs: query.data?.logs ?? [],
    pagination: query.data?.pagination ?? {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    },
  };
}
