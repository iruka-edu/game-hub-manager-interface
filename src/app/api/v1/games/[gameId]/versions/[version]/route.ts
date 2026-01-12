import { NextResponse } from 'next/server';
import { gamesApi, type GameVersionUpdate } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    gameId: string;
    version: string;
  }>;
}

/**
 * PUT /api/v1/games/{gameId}/versions/{version}
 * Proxy to backend: PUT /api/v1/games/{game_id}/versions/{version}
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { gameId, version } = await params;
    const body: GameVersionUpdate = await request.json();
    const result = await gamesApi.updateGameVersion(gameId, version, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating game version:', error);
    return NextResponse.json(
      { error: 'Failed to update game version' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/games/{gameId}/versions/{version}
 * Proxy to backend: DELETE /api/v1/games/{game_id}/versions/{version}
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { gameId, version } = await params;
    const result = await gamesApi.deleteGameVersion(gameId, version);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting game version:', error);
    return NextResponse.json(
      { error: 'Failed to delete game version' },
      { status: 500 }
    );
  }
}
