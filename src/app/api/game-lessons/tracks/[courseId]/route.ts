import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    courseId: string;
  }>;
}

/**
 * GET /api/game-lessons/tracks/{courseId}
 * Proxy to backend: GET /api/v1/game-lessons/tracks/{course_id}
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { courseId } = await params;
    const tracks = await gameLessonsApi.getTracksByCourse(courseId);
    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks by course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
