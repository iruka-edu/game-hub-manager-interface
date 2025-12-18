import { NotificationRepository, type NotificationType, type Notification } from '../models/Notification';
import { UserRepository } from '../models/User';

/**
 * Notification Service for creating and managing notifications
 */
export const NotificationService = {
  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    gameId?: string
  ): Promise<Notification> {
    const repo = await NotificationRepository.getInstance();
    return repo.create({ userId, type, title, message, gameId });
  },

  /**
   * Notify game owner about QC result
   */
  async notifyQcResult(
    ownerId: string,
    gameTitle: string,
    gameId: string,
    result: 'pass' | 'fail',
    note?: string
  ): Promise<void> {
    const type: NotificationType = result === 'pass' ? 'qc_passed' : 'qc_failed';
    const title = result === 'pass'
      ? `Game "${gameTitle}" đã QC đạt`
      : `Game "${gameTitle}" cần sửa`;
    const message = result === 'pass'
      ? 'Game của bạn đã được QC duyệt, đang chờ CTO phê duyệt.'
      : `Game của bạn cần sửa. ${note || ''}`;

    await this.createNotification(ownerId, type, title, message, gameId);
  },

  /**
   * Notify QC users about new game submission
   */
  async notifyGameSubmitted(
    gameTitle: string,
    gameId: string,
    devName: string
  ): Promise<void> {
    const userRepo = await UserRepository.getInstance();
    const users = await userRepo.findAll();
    const qcUsers = users.filter(u => u.roles.includes('qc') || u.roles.includes('admin'));

    const repo = await NotificationRepository.getInstance();
    for (const user of qcUsers) {
      await repo.create({
        userId: user._id.toString(),
        type: 'game_submitted',
        title: `Game mới cần QC: "${gameTitle}"`,
        message: `${devName} đã gửi game để kiểm tra chất lượng.`,
        gameId,
      });
    }
  },

  /**
   * Notify CTO/CEO about QC passed game
   */
  async notifyQcPassed(
    gameTitle: string,
    gameId: string
  ): Promise<void> {
    const userRepo = await UserRepository.getInstance();
    const users = await userRepo.findAll();
    const approvers = users.filter(u => 
      u.roles.includes('cto') || u.roles.includes('ceo') || u.roles.includes('admin')
    );

    const repo = await NotificationRepository.getInstance();
    for (const user of approvers) {
      await repo.create({
        userId: user._id.toString(),
        type: 'qc_passed',
        title: `Game "${gameTitle}" chờ duyệt`,
        message: 'Game đã QC đạt, cần phê duyệt để xuất bản.',
        gameId,
      });
    }
  },

  /**
   * Notify owner about game approval
   */
  async notifyGameApproved(
    ownerId: string,
    gameTitle: string,
    gameId: string
  ): Promise<void> {
    await this.createNotification(
      ownerId,
      'game_approved',
      `Game "${gameTitle}" đã được duyệt`,
      'Game của bạn đã được CTO/CEO phê duyệt, đang chờ xuất bản.',
      gameId
    );
  },

  /**
   * Notify owner about game publication
   */
  async notifyGamePublished(
    ownerId: string,
    gameTitle: string,
    gameId: string
  ): Promise<void> {
    await this.createNotification(
      ownerId,
      'game_published',
      `Game "${gameTitle}" đã xuất bản`,
      'Game của bạn đã được xuất bản thành công!',
      gameId
    );
  },

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const repo = await NotificationRepository.getInstance();
    return repo.getUnreadCount(userId);
  },

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    const repo = await NotificationRepository.getInstance();
    return repo.findByUserId(userId, limit);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const repo = await NotificationRepository.getInstance();
    return repo.markAsRead(notificationId);
  },
};
