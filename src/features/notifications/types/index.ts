/**
 * Notifications Feature Types
 * Matching BE_vu_v2.json API schemas
 */

/**
 * Notification output
 * Matches NotificationOut schema
 */
export interface Notification {
  id: string;
  user_id: string;
  game_id?: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Notifications list response
 * Matches NotificationListResponse schema
 */
export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

/**
 * Mark as read response
 * Matches NotificationMarkReadResponse
 */
export interface MarkAsReadResponse {
  success: boolean;
  notification_id: string;
}

/**
 * Mark all as read response
 * Matches NotificationMarkAllReadResponse
 */
export interface MarkAllAsReadResponse {
  success: boolean;
  count: number;
}

/**
 * Get notifications params
 */
export interface GetNotificationsParams {
  limit?: number;
  skip?: number;
}
