/**
 * Notifications Feature Types
 */

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}
