import { NextResponse } from 'next/server';
import { gamesApi, type GameVersionCreate } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    gameId: string;
  }>;
}

/**
 * POST /api/v1/games/{gameId}/versions
 * Proxy to backend: POST /api/v1/games/{game_id}/versions
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { gameId } = await params;
    const body: GameVersionCreate = await request.json();
    const version = await gamesApi.createGameVersion(gameId, body);
    return NextResponse.json(version);
  } catch (error) {
    console.error('Error creating game version:', error);
    return NextResponse.json(
      { error: 'Failed to create game version' },
      { status: 500 }
    );
  }
}
