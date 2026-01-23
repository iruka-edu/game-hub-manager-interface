/**
 * Notification types
 */
export type NotificationType =
  | "game_submitted"
  | "qc_passed"
  | "qc_failed"
  | "game_approved"
  | "game_published"
  | "comment_added";

/**
 * Notification interface
 */
export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  gameId?: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Input for creating a notification
 */
export type CreateNotificationInput = Omit<
  Notification,
  "_id" | "createdAt" | "isRead"
>;
