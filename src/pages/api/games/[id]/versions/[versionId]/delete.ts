import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../../../models/Game';
import { GameVersionRepository } from '../../../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../../../lib/session';
import { AuditLogger } from '../../../../../../lib/audit';
import { GameHistoryService } from '../../../../../../lib/game-history';

/**
 * DELETE /api/games/[id]/versions/[versionId]
 * Soft delete a version (cannot delete active version)
 */
export const DELETE: APIRoute = async ({ params, request }) => {
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

    // Check permission - only owner or admin can delete versions
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to delete versions for this game' }),
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

    // Check if version is already deleted
    if (version.isDeleted) {
      return new Response(
        JSON.stringify({ error: 'Version is already deleted' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Prevent deletion of active version (liveVersionId)
    if (game.liveVersionId?.toString() === versionId) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot delete the active version. Please activate a different version first.',
          code: 'ACTIVE_VERSION_DELETION_PREVENTED'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Also prevent deletion of latest version if it's referenced
    if (game.latestVersionId?.toString() === versionId) {
      // Find other non-deleted versions to potentially set as latest
      const allVersions = await versionRepo.findByGameId(gameId);
      const otherVersions = allVersions.filter(
        v => v._id.toString() !== versionId && !v.isDeleted
      );
      
      if (otherVersions.length > 0) {
        // Sort by creation date and set the newest as latest
        otherVersions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        await gameRepo.updateLatestVersion(gameId, otherVersions[0]._id);
      } else {
        // This is the last version, clear latestVersionId
        await gameRepo.update(gameId, { latestVersionId: undefined });
      }
    }

    // Soft delete the version
    const deletedVersion = await versionRepo.softDelete(versionId);
    
    if (!deletedVersion) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete version' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Record history
    await GameHistoryService.recordVersionDeletion(
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
      action: 'VERSION_DELETED',
      target: {
        entity: 'GAME_VERSION',
        id: versionId,
      },
      changes: [
        {
          field: 'isDeleted',
          oldValue: false,
          newValue: true,
        },
      ],
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Version ${version.version} deleted successfully`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete version error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
