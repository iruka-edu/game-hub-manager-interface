import { NextResponse } from 'next/server';
import { gamesApi, type GameCreate } from '@/lib/backend-api';

/**
 * GET /api/v1/games/
 * Proxy to backend: GET /api/v1/games/
 */
export async function GET() {
  try {
    const games = await gamesApi.listGames();
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error listing games:', error);
    return NextResponse.json(
      { error: 'Failed to list games' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/games/
 * Proxy to backend: POST /api/v1/games/
 */
export async function POST(request: Request) {
  try {
    const body: GameCreate = await request.json();
    const game = await gamesApi.createGame(body);
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
