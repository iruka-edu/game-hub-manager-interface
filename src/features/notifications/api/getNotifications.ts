/**
 * Notifications API Functions
 */

import { apiGet } from "@/lib/api-fetch";
import type { NotificationsResponse } from "../types";

/**
 * Fetch user notifications
 * GET /api/notifications
 */
export async function getNotifications(): Promise<NotificationsResponse> {
  return apiGet<NotificationsResponse>("/api/notifications");
}
