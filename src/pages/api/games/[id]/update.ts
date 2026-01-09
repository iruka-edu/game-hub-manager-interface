import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getUserFromRequest } from '../../../../lib/session';
import { hasPermissionString } from '../../../../auth/auth-rbac';
import { GameRepository } from '../../../../models/Game';
import { AuditLogger } from '../../../../lib/audit';
import { GameHistoryService } from '../../../../lib/game-history';

/**
 * PUT /api/games/[id]/update
 * Update game metadata and information
 */
export const PUT: APIRoute = async ({ request, params }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameId = params.id;
    if (!gameId || !ObjectId.isValid(gameId)) {
      return new Response(JSON.stringify({ error: 'Invalid game ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json();
    const { 
      title, 
      description, 
      subject, 
      grade, 
      gameType, 
      priority,
      metadata,
      thumbnailDesktop,
      thumbnailMobile,
    } = body;

    // Get game repository
    const gameRepo = await GameRepository.getInstance();
    
    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permissions
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    const canEdit = isOwner || isAdmin || hasPermissionString(user, 'games:edit');

    if (!canEdit) {
      return new Response(JSON.stringify({ error: 'You can only edit your own games' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update basic fields if provided
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (grade !== undefined) updateData.grade = grade;
    if (gameType !== undefined) updateData.gameType = gameType;
    if (priority !== undefined) updateData.priority = priority;
    if (thumbnailDesktop !== undefined) updateData.thumbnailDesktop = thumbnailDesktop;
    if (thumbnailMobile !== undefined) updateData.thumbnailMobile = thumbnailMobile;

    // Handle metadata update
    if (metadata) {
      // Merge with existing metadata if it exists
      const existingMetadata = (game as any).metadata || {};
      updateData.metadata = {
        ...existingMetadata,
        ...metadata,
        updatedAt: new Date().toISOString(),
        updatedBy: user._id.toString(),
      };
    }

    // Track changes for audit log
    const changes: Record<string, any> = {};
    const previousValues: Record<string, any> = {};

    Object.keys(updateData).forEach(key => {
      if (key !== 'updatedAt' && updateData[key] !== (game as any)[key]) {
        changes[key] = updateData[key];
        previousValues[key] = (game as any)[key];
      }
    });

    // Update the game
    const updatedGame = await gameRepo.update(gameId, updateData);

    // Log the update
    await AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_METADATA_UPDATE',
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

    // Add to game history
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

    return new Response(JSON.stringify({
      success: true,
      message: 'Game updated successfully',
      data: {
        game: updatedGame,
        changes,
        fieldsUpdated: Object.keys(changes),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Update game API error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};