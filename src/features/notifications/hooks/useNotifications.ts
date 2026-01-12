"use client";

/**
 * useNotifications Hook
 * React Query hook for fetching notifications
 */

import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../api/getNotifications";

/**
 * Query key factory for notifications
 */
export const notificationsKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
  unreadCount: () => [...notificationsKeys.all, "unreadCount"] as const,
};

/**
 * Hook to fetch notifications
 */
export function useNotifications() {
  const query = useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: getNotifications,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
  });

  return {
    ...query,
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
  };
}
