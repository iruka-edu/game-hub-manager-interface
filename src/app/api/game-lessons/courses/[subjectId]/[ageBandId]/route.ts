import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    subjectId: string;
    ageBandId: string;
  }>;
}

/**
 * GET /api/game-lessons/courses/{subjectId}/{ageBandId}
 * Proxy to backend: GET /api/v1/game-lessons/courses/{subject_id}/{age_band_id}
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { subjectId, ageBandId } = await params;
    const courses = await gameLessonsApi.getCourses(subjectId, ageBandId);
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
