import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

/**
 * GET /api/game-lessons/age-bands
 * Proxy to backend: GET /api/v1/game-lessons/age-bands
 */
export async function GET() {
  try {
    const ageBands = await gameLessonsApi.getAgeBands();
    return NextResponse.json(ageBands);
  } catch (error) {
    console.error('Error fetching age bands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch age bands' },
      { status: 500 }
    );
  }
}
