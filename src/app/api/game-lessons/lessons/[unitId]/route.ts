import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    unitId: string;
  }>;
}

/**
 * GET /api/game-lessons/lessons/{unitId}
 * Proxy to backend: GET /api/v1/game-lessons/lessons/{unit_id}
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { unitId } = await params;
    const lessons = await gameLessonsApi.getLessonsByUnit(unitId);
    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons by unit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
