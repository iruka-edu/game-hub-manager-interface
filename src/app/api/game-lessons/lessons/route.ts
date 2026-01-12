import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

/**
 * GET /api/game-lessons/lessons?track_id={}
 * Proxy to backend: GET /api/v1/game-lessons/lessons?track_id={}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('track_id');
    
    if (!trackId) {
      return NextResponse.json(
        { error: 'track_id is required' },
        { status: 400 }
      );
    }
    
    const lessons = await gameLessonsApi.getLessonsByTrack(trackId);
    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
