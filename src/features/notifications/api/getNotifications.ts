/**
 * Notifications API Functions
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiGet, apiPost } from "@/lib/api-fetch";
import type {
  NotificationsResponse,
  GetNotificationsParams,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
} from "../types";

/**
 * Fetch user notifications
 * GET /api/v1/notifications/
 */
export async function getNotifications(
  params?: GetNotificationsParams,
): Promise<NotificationsResponse> {
  return apiGet<NotificationsResponse>("/api/v1/notifications/", {
    limit: params?.limit ?? 20,
    skip: params?.skip ?? 0,
  });
}

/**
 * Mark notification as read
 * POST /api/v1/notifications/{notification_id}/read
 */
export async function markAsRead(
  notificationId: string,
): Promise<MarkAsReadResponse> {
  return apiPost<MarkAsReadResponse>(
    `/api/v1/notifications/${notificationId}/read`,
  );
}

/**
 * Mark all notifications as read
 * POST /api/v1/notifications/read-all
 */
export async function markAllAsRead(): Promise<MarkAllAsReadResponse> {
  return apiPost<MarkAllAsReadResponse>("/api/v1/notifications/read-all");
}
