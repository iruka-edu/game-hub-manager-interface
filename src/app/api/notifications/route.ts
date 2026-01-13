import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

/**
 * GET /api/notifications
 * Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Mock notifications for now - replace with actual database query
    const notifications = [
      {
        _id: '1',
        title: 'Game đã được phê duyệt',
        message: 'Game "Math Adventure" đã được CTO phê duyệt và sẵn sàng publish',
        gameId: 'com.iruka.math-adventure',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2', 
        title: 'QC Review hoàn thành',
        message: 'Game "English Quiz" đã pass QC và chờ phê duyệt',
        gameId: 'com.iruka.english-quiz',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ];

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Mark notification as read
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    // Mock implementation - replace with actual database update
    console.log('Marking notification as read:', { notificationId, markAllRead });

    return NextResponse.json({
      success: true,
      message: markAllRead ? 'All notifications marked as read' : 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}