import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../../../models/Game';
import { GameVersionRepository } from '../../../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../../../lib/session';
import { AuditLogger } from '../../../../../../lib/audit';
import { GameHistoryService } from '../../../../../../lib/game-history';

/**
 * POST /api/games/[id]/versions/[versionId]/activate
 * Activate a specific version (set as liveVersionId)
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

    const { id: gameId, versionId } = params;
    
    if (!gameId || !versionId) {
      return new Response(
        JSON.stringify({ error: 'Game ID and Version ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    // Check permission - only owner or admin can activate versions
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to activate versions for this game' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
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
    if (version.gameId.toString() !== gameId) {
      return new Response(
        JSON.stringify({ error: 'Version does not belong to this game' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if version is deleted
    if (version.isDeleted) {
      return new Response(
        JSON.stringify({ error: 'Cannot activate a deleted version' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store old liveVersionId for audit
    const oldLiveVersionId = game.liveVersionId?.toString();

    // Update game's liveVersionId
    const updatedGame = await gameRepo.updateLiveVersion(gameId, version._id);
    
    if (!updatedGame) {
      return new Response(
        JSON.stringify({ error: 'Failed to activate version' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Record history
    await GameHistoryService.recordVersionActivation(
      gameId,
      versionId,
      version.version,
      user
    );

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'VERSION_ACTIVATED',
      target: {
        entity: 'GAME',
        id: gameId,
      },
      changes: [
        {
          field: 'liveVersionId',
          oldValue: oldLiveVersionId || null,
          newValue: versionId,
        },
      ],
    });

    return new Response(
      JSON.stringify({
        success: true,
        game: {
          _id: updatedGame._id.toString(),
          gameId: updatedGame.gameId,
          title: updatedGame.title,
          liveVersionId: updatedGame.liveVersionId?.toString(),
        },
        message: `Version ${version.version} activated successfully`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Activate version error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
