import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { GameRepository } from '@/models/Game';

/**
 * GET /api/games/check-duplicate?gameId=xxx
 * Check if a gameId already exists
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Role check - only dev and admin can check duplicates
    const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
    if (!hasRole('dev') && !hasRole('admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: 'gameId parameter is required' }, { status: 400 });
    }

    const gameRepo = await GameRepository.getInstance();
    const existingGame = await gameRepo.findByGameId(gameId);

    return NextResponse.json({
      success: true,
      exists: !!existingGame,
      gameId,
      existingGame: existingGame ? {
        _id: existingGame._id.toString(),
        title: existingGame.title,
        ownerId: existingGame.ownerId,
        isOwner: existingGame.ownerId === session.userId,
      } : null,
    });
  } catch (error) {
    console.error('Check duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}