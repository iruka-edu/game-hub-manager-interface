import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

/**
 * GET /api/game-lessons/levels
 * Proxy to backend: GET /api/v1/game-lessons/levels
 */
export async function GET() {
  try {
    const levels = await gameLessonsApi.getLevels();
    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch levels' },
      { status: 500 }
    );
  }
}
