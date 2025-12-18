import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../lib/session';
import { hasPermissionString } from '../../../../auth/auth-rbac';
import { AuditLogger } from '../../../../lib/audit';
import { GameHistoryService } from '../../../../lib/game-history';

/**
 * POST /api/games/[id]/set-live
 * Set a specific version as the live version for users
 * Only published versions can be set as live
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission - only admin can set live version
    if (!hasPermissionString(user, 'games:publish')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameId = params.id;
    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Game ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      return new Response(JSON.stringify({ error: 'versionId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the version
    const version = await versionRepo.findById(versionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify version belongs to this game
    if (version.gameId.toString() !== game._id.toString()) {
      return new Response(JSON.stringify({ error: 'Version does not belong to this game' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check version status - must be published
    if (version.status !== 'published') {
      return new Response(JSON.stringify({ 
        error: `Only published versions can be set as live. Current status: ${version.status}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get previous live version for logging
    const previousLiveVersionId = game.liveVersionId?.toString();

    // Update game with new liveVersionId
    const updatedGame = await gameRepo.updateLiveVersion(gameId, version._id);

    // Record history
    await GameHistoryService.recordStatusChange(
      gameId,
      user,
      undefined,
      undefined,
      { 
        action: 'set_live_version',
        previousLiveVersionId,
        newLiveVersionId: versionId,
        version: version.version,
      }
    );

    // Audit log
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_SET_LIVE',
      target: {
        entity: 'GAME',
        id: gameId,
      },
      changes: [
        { field: 'liveVersionId', oldValue: previousLiveVersionId, newValue: versionId },
      ],
      metadata: {
        gameId: game.gameId,
        version: version.version,
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      game: updatedGame,
      liveVersion: {
        _id: version._id.toString(),
        version: version.version,
        storagePath: version.storagePath,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Set live version error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
