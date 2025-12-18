import type { APIRoute } from 'astro';
import { NotificationService } from '../../lib/notification';
import { NotificationRepository } from '../../models/Notification';
import { getUserFromRequest } from '../../lib/session';

/**
 * GET /api/notifications
 * Get notifications for current user
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user._id.toString();
    const [notifications, unreadCount] = await Promise.all([
      NotificationService.getNotifications(userId, 20),
      NotificationService.getUnreadCount(userId),
    ]);

    return new Response(
      JSON.stringify({ notifications, unreadCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get notifications error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST /api/notifications
 * Mark notification as read
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      const repo = await NotificationRepository.getInstance();
      const count = await repo.markAllAsRead(user._id.toString());
      return new Response(
        JSON.stringify({ success: true, markedCount: count }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!notificationId) {
      return new Response(JSON.stringify({ error: 'notificationId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await NotificationService.markAsRead(notificationId);

    return new Response(
      JSON.stringify({ success }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Mark notification error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
