import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { UserRepository } from '@/models/User';
import { hasPermissionString } from '@/lib/auth-rbac';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { AuditLogger } from '@/lib/audit';
import { GameHistoryService } from '@/lib/game-history';

/**
 * GET /api/games/[id]
 * Get game details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check using cookies
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

    const { id: gameId } = await params;
    if (!gameId || !ObjectId.isValid(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    const canView = isOwner || isAdmin || hasPermissionString(user, 'games:view');

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get version info
    let latestVersion = null;
    let liveVersion = null;

    if (game.latestVersionId) {
      latestVersion = await versionRepo.findById(game.latestVersionId.toString());
    }

    if (game.liveVersionId) {
      liveVersion = await versionRepo.findById(game.liveVersionId.toString());
    }

    return NextResponse.json({
      game,
      latestVersion,
      liveVersion,
    }, { status: 200 });
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/games/[id]
 * Update game metadata
 * Migrated from: src/pages/api/games/[id]/update.ts
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    console.log('[Game Update] Starting update for game:', gameId);
    
    // Auth check using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      console.log('[Game Update] No session cookie');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      console.log('[Game Update] Invalid session');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);
    
    if (!user) {
      console.log('[Game Update] User not found:', session.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    if (!gameId || !ObjectId.isValid(gameId)) {
      console.log('[Game Update] Invalid game ID:', gameId);
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const body = await request.json();
    console.log('[Game Update] Request body:', body);
    
    const { 
      title, 
      description, 
      subject, 
      grade, 
      unit,
      gameType, 
      lesson,
      level,
      skills,
      themes,
      linkGithub,
      quyenSach,
    } = body;

    const gameRepo = await GameRepository.getInstance();
    const game = await gameRepo.findById(gameId);
    if (!game) {
      console.log('[Game Update] Game not found:', gameId);
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    console.log('[Game Update] Found game:', game.gameId);

    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    const canEdit = isOwner || isAdmin || hasPermissionString(user, 'games:update');

    if (!canEdit) {
      console.log('[Game Update] Permission denied:', { isOwner, isAdmin, userId: user._id.toString(), gameOwner: game.ownerId });
      return NextResponse.json({ error: 'You can only edit your own games' }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (grade !== undefined) updateData.grade = grade;
    if (unit !== undefined) updateData.unit = unit;
    if (gameType !== undefined) updateData.gameType = gameType;
    if (lesson !== undefined) updateData.lesson = lesson;
    if (level !== undefined) updateData.level = level;
    if (skills !== undefined) updateData.skills = skills;
    if (themes !== undefined) updateData.themes = themes;
    if (linkGithub !== undefined) updateData.linkGithub = linkGithub;
    if (quyenSach !== undefined) updateData.quyenSach = quyenSach;

    const changes: Record<string, any> = {};
    const previousValues: Record<string, any> = {};

    Object.keys(updateData).forEach(key => {
      if (key !== 'updatedAt' && updateData[key] !== (game as any)[key]) {
        changes[key] = updateData[key];
        previousValues[key] = (game as any)[key];
      }
    });

    const updatedGame = await gameRepo.update(gameId, updateData);

    await AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_UPDATE_METADATA',
      target: {
        entity: 'GAME',
        id: gameId,
      },
      metadata: {
        changes,
        previousValues,
        fieldsUpdated: Object.keys(changes),
      },
    });

    const changesSummary = Object.keys(changes).join(', ');
    await GameHistoryService.addEntry(
      gameId,
      `Cập nhật thông tin: ${changesSummary}`,
      user,
      undefined,
      undefined,
      {
        changes,
        fieldsUpdated: Object.keys(changes),
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Game updated successfully',
      data: {
        game: updatedGame,
        changes,
        fieldsUpdated: Object.keys(changes),
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update game API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/games/[id]
 * Soft delete a game (dev draft delete or admin soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check using cookies
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

    const { id: gameId } = await params;
    if (!gameId || !ObjectId.isValid(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.isDeleted) {
      return NextResponse.json({ error: 'Game is already deleted' }, { status: 400 });
    }

    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');

    // Admin soft delete - check this FIRST before dev draft delete
    // This allows admins to delete any game regardless of ownership
    if (isAdmin && hasPermissionString(user, 'games:delete_soft')) {
      const body = await request.json().catch(() => ({}));
      const reason = body.reason || 'admin_soft_delete';

      await gameRepo.delete(gameId);
      
      await AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'GAME_SOFT_DELETE',
        target: {
          entity: 'GAME',
          id: gameId,
        },
        metadata: {
          deleteType: 'admin_soft_delete',
          reason,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Game soft deleted successfully' 
      }, { status: 200 });
    }

    // Check if dev can delete own draft
    if (isOwner && hasPermissionString(user, 'games:delete_own_draft')) {
      // Check if game has only draft versions (never submitted to QC)
      if (game.latestVersionId) {
        const latestVersion = await versionRepo.findById(game.latestVersionId.toString());
        if (latestVersion && latestVersion.status !== 'draft') {
          return NextResponse.json({ 
            error: 'Cannot delete game that has been submitted to QC' 
          }, { status: 403 });
        }
      }

      // Dev draft delete
      await gameRepo.delete(gameId);
      
      await AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'GAME_SOFT_DELETE',
        target: {
          entity: 'GAME',
          id: gameId,
        },
        metadata: {
          deleteType: 'dev_draft_delete',
          reason: 'dev_draft_deleted',
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Draft game deleted successfully' 
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error: any) {
    console.error('Delete game error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}
