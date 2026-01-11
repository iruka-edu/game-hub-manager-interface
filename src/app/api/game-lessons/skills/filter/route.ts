import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

/**
 * GET /api/game-lessons/skills/filter?age_band_id={}&subject_id={}
 * Proxy to backend: GET /api/v1/game-lessons/skills/filter?age_band_id={}&subject_id={}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ageBandId = searchParams.get('age_band_id');
    const subjectId = searchParams.get('subject_id');
    
    if (!ageBandId || !subjectId) {
      return NextResponse.json(
        { error: 'age_band_id and subject_id are required' },
        { status: 400 }
      );
    }
    
    const skills = await gameLessonsApi.getSkillsFiltered(ageBandId, subjectId);
    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching filtered skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
