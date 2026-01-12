import { NextResponse } from 'next/server';

/**
 * GET /api/notifications
 * Returns user notifications (placeholder for now)
 */
export async function GET() {
  // TODO: Implement actual notifications from database
  // For now, return empty array
  return NextResponse.json({
    notifications: [],
    unreadCount: 0,
  });
}
