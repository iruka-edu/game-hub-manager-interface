import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

/**
 * GET /api/game-lessons/tracks?subject_id={}&age_band_id={}
 * Proxy to backend: GET /api/v1/game-lessons/tracks?subject_id={}&age_band_id={}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subject_id');
    const ageBandId = searchParams.get('age_band_id');
    
    if (!subjectId || !ageBandId) {
      return NextResponse.json(
        { error: 'subject_id and age_band_id are required' },
        { status: 400 }
      );
    }
    
    const tracks = await gameLessonsApi.getTracksBySubjectAndAgeBand(subjectId, ageBandId);
    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
