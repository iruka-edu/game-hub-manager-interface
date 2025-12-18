import { ObjectId, type Collection, type Db } from 'mongodb';
import { getMongoClient } from '../lib/mongodb';

/**
 * Notification types
 */
export type NotificationType =
  | 'game_submitted'
  | 'qc_passed'
  | 'qc_failed'
  | 'game_approved'
  | 'game_published'
  | 'comment_added';

/**
 * Notification interface
 */
export interface Notification {
  _id: ObjectId;
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
export type CreateNotificationInput = Omit<Notification, '_id' | 'createdAt' | 'isRead'>;

/**
 * Notification Repository
 */
export class NotificationRepository {
  private collection: Collection<Notification>;

  constructor(db: Db) {
    this.collection = db.collection<Notification>('notifications');
  }

  static async getInstance(): Promise<NotificationRepository> {
    const { db } = await getMongoClient();
    return new NotificationRepository(db);
  }

  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification: Omit<Notification, '_id'> = {
      ...input,
      isRead: false,
      createdAt: new Date(),
    };

    const result = await this.collection.insertOne(notification as Notification);
    return { ...notification, _id: result.insertedId } as Notification;
  }

  /**
   * Find notifications by user ID
   */
  async findByUserId(userId: string, limit = 20): Promise<Notification[]> {
    return this.collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.collection.countDocuments({ userId, isRead: false });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isRead: true } }
      );
      return result.modifiedCount === 1;
    } catch {
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.collection.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    return result.modifiedCount;
  }

  /**
   * Ensure indexes
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ userId: 1, isRead: 1 });
    await this.collection.createIndex({ createdAt: -1 });
  }
}
