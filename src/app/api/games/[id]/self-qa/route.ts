import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getUserFromHeaders } from '@/lib/auth';
import { hasPermissionString } from '@/lib/auth-rbac';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import type { SelfQAChecklist } from '@/models/GameVersion';
import { AuditLogger } from '@/lib/audit';
import { GameHistoryService } from '@/lib/game-history';

/**
 * POST /api/games/[id]/self-qa
 * Update Self-QA checklist for a game version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Debug: Log headers to see what we're getting
    console.log('Headers received:', {
      'x-user-id': request.headers.get('x-user-id'),
      'x-user-email': request.headers.get('x-user-email'),
      'x-user-roles': request.headers.get('x-user-roles'),
      'cookie': request.headers.get('cookie') ? 'exists' : 'missing',
    });

    let user = await getUserFromHeaders(request.headers);
    console.log('User from headers:', user ? 'found' : 'not found');
    
    if (!user) {
      // Try alternative method - get user from cookies directly
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split('=');
          acc[name] = value;
          return acc;
        }, {} as Record<string, string>);
        
        const sessionToken = cookies['iruka_session'];
        console.log('Session token from cookie:', sessionToken ? 'exists' : 'missing');
        
        if (sessionToken) {
          const { verifySession } = await import('@/lib/session');
          const { UserRepository } = await import('@/models/User');
          
          const session = verifySession(sessionToken);
          console.log('Session verification result:', session ? 'valid' : 'invalid');
          
          if (session) {
            const userRepo = await UserRepository.getInstance();
            user = await userRepo.findById(session.userId);
            console.log('User from session:', user ? 'found' : 'not found');
          }
        }
      }
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id: gameId } = await params;
    if (!gameId || !ObjectId.isValid(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const body = await request.json();
    const { versionId, checklist } = body;

    if (!versionId || !ObjectId.isValid(versionId)) {
      return NextResponse.json({ error: 'Invalid version ID' }, { status: 400 });
    }

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist is required' }, { status: 400 });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const version = await versionRepo.findById(versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Check permissions - only owner or admin can update self-QA
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    const canEdit = isOwner || isAdmin || hasPermissionString(user, 'games:update');

    if (!canEdit) {
      return NextResponse.json({ error: 'You can only edit your own games' }, { status: 403 });
    }

    // Validate checklist structure
    const validChecklist: SelfQAChecklist = {
      testedDevices: Boolean(checklist.testedDevices),
      testedAudio: Boolean(checklist.testedAudio),
      gameplayComplete: Boolean(checklist.gameplayComplete),
      contentVerified: Boolean(checklist.contentVerified),
      note: checklist.note || undefined,
    };

    // Update the version with the new checklist
    const updatedVersion = await versionRepo.updateSelfQA(versionId, validChecklist);

    if (!updatedVersion) {
      return NextResponse.json({ error: 'Failed to update Self-QA checklist' }, { status: 500 });
    }

    // Log the action
    await AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_UPDATE_SELF_QA',
      target: {
        entity: 'GAME_VERSION',
        id: versionId,
      },
      metadata: {
        gameId,
        checklist: validChecklist,
        completionStatus: {
          testedDevices: validChecklist.testedDevices,
          testedAudio: validChecklist.testedAudio,
          gameplayComplete: validChecklist.gameplayComplete,
          contentVerified: validChecklist.contentVerified,
          isComplete: validChecklist.testedDevices && 
                     validChecklist.testedAudio && 
                     validChecklist.gameplayComplete && 
                     validChecklist.contentVerified,
        },
      },
    });

    // Add history entry
    const completedItems = [
      validChecklist.testedDevices && 'Tested Devices',
      validChecklist.testedAudio && 'Audio Check',
      validChecklist.gameplayComplete && 'Gameplay Complete',
      validChecklist.contentVerified && 'Content Verified',
    ].filter(Boolean);

    await GameHistoryService.addEntry(
      gameId,
      `Cập nhật Self-QA Checklist: ${completedItems.join(', ')}`,
      user,
      versionId,
      undefined,
      {
        checklist: validChecklist,
        completedItems: completedItems.length,
        totalItems: 4,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Self-QA checklist updated successfully',
      data: {
        version: updatedVersion,
        checklist: validChecklist,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update Self-QA API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}