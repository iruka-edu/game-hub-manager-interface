import { NextResponse } from 'next/server';
import { gameLessonsApi } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    trackId: string;
  }>;
}

/**
 * GET /api/game-lessons/units/{trackId}
 * Proxy to backend: GET /api/v1/game-lessons/units/{track_id}
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { trackId } = await params;
    const units = await gameLessonsApi.getUnits(trackId);
    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch units' },
      { status: 500 }
    );
  }
}
