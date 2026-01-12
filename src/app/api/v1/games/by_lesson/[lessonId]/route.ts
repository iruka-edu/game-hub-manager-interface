import { NextResponse } from 'next/server';
import { gamesApi } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    lessonId: string;
  }>;
}

/**
 * GET /api/v1/games/by_lesson/{lessonId}
 * Proxy to backend: GET /api/v1/games/by_lesson/{lesson_id}
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { lessonId } = await params;
    const games = await gamesApi.getGamesByLesson(lessonId);
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error getting games by lesson:', error);
    return NextResponse.json(
      { error: 'Failed to get games by lesson' },
      { status: 500 }
    );
  }
}
