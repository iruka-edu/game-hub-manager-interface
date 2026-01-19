/**
 * Notifications API Functions
 * Calling external API at NEXT_PUBLIC_BASE_API_URL
 */

import { externalApiGet, externalApiPost } from "@/lib/external-api";
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
  params?: GetNotificationsParams
): Promise<NotificationsResponse> {
  return externalApiGet<NotificationsResponse>("/api/v1/notifications/", {
    limit: params?.limit ?? 20,
    skip: params?.skip ?? 0,
  });
}

/**
 * Mark notification as read
 * POST /api/v1/notifications/{notification_id}/read
 */
export async function markAsRead(
  notificationId: string
): Promise<MarkAsReadResponse> {
  return externalApiPost<MarkAsReadResponse>(
    `/api/v1/notifications/${notificationId}/read`
  );
}

/**
 * Mark all notifications as read
 * POST /api/v1/notifications/read-all
 */
export async function markAllAsRead(): Promise<MarkAllAsReadResponse> {
  return externalApiPost<MarkAllAsReadResponse>(
    "/api/v1/notifications/read-all"
  );
}
