import { NextResponse } from 'next/server';
import { gamesApi, type GameUpdate } from '@/lib/backend-api';

interface Params {
  params: Promise<{
    gameId: string;
  }>;
}

/**
 * GET /api/v1/games/{gameId}
 * Proxy to backend: GET /api/v1/games/{game_id}
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { gameId } = await params;
    const game = await gamesApi.getGame(gameId);
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error getting game:', error);
    return NextResponse.json(
      { error: 'Failed to get game' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/games/{gameId}
 * Proxy to backend: PUT /api/v1/games/{game_id}
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { gameId } = await params;
    const body: GameUpdate = await request.json();
    const game = await gamesApi.updateGame(gameId, body);
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/games/{gameId}
 * Proxy to backend: DELETE /api/v1/games/{game_id}
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get('deleted_by') || undefined;
    const reason = searchParams.get('reason') || undefined;
    
    const game = await gamesApi.deleteGame(gameId, deletedBy, reason);
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}
