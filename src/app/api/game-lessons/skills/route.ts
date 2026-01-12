import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

/**
 * GET /api/game-lessons/skills
 * Proxy to backend: GET /api/v1/game-lessons/skills
 */
export async function GET() {
  try {
    const skills = await gameLessonsApi.getSkills();
    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
