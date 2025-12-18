import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../lib/session';
import { hasPermissionString } from '../../../../auth/auth-rbac';
import { AuditLogger } from '../../../../lib/audit';
import { NotificationService } from '../../../../lib/notification';
import { GameHistoryService } from '../../../../lib/game-history';
import { VersionStateMachine } from '../../../../lib/version-state-machine';
import { PublicRegistryManager } from '../../../../lib/public-registry';
import { listFiles } from '../../../../lib/gcs';

/**
 * POST /api/games/[id]/publish
 * Admin publishes a game version after approval
 * Changes version status: approved -> published
 * Optionally sets as live version
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

    // Check permission
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
    const { versionId, setAsLive = false, rolloutPercentage } = body;

    // Validate rolloutPercentage if provided
    if (rolloutPercentage !== undefined) {
      if (typeof rolloutPercentage !== 'number' || rolloutPercentage < 0 || rolloutPercentage > 100) {
        return new Response(JSON.stringify({ error: 'Rollout percentage must be between 0 and 100' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

    // Get target version
    let targetVersionId = versionId;
    if (!targetVersionId && game.latestVersionId) {
      targetVersionId = game.latestVersionId.toString();
    }

    if (!targetVersionId) {
      return new Response(JSON.stringify({ error: 'No version to publish' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const version = await versionRepo.findById(targetVersionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if game is disabled (kill-switch)
    if (game.disabled) {
      return new Response(JSON.stringify({ error: 'Cannot publish disabled game. Enable the game first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate that version files exist on GCS
    const versionFiles = await listFiles(version.storagePath);
    const hasIndexHtml = versionFiles.some(f => f.endsWith(version.entryFile));
    if (!hasIndexHtml) {
      return new Response(JSON.stringify({ error: 'Version files not found on storage. Please re-upload the game.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use state machine for transition
    const stateMachine = await VersionStateMachine.getInstance();
    
    if (!stateMachine.canTransition(version.status, 'publish')) {
      return new Response(JSON.stringify({ 
        error: `Cannot publish version in "${version.status}" status. Only approved versions can be published.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const oldStatus = version.status;
    const updatedVersion = await stateMachine.transition(targetVersionId, 'publish', user._id.toString());

    // Update rollout percentage if provided
    if (rolloutPercentage !== undefined) {
      await gameRepo.updateRolloutPercentage(gameId, rolloutPercentage);
    }

    // Set as live version (required for Public Registry)
    // If setAsLive is true or this is the first published version
    const shouldSetLive = setAsLive || !game.liveVersionId;
    if (shouldSetLive) {
      await gameRepo.updateLiveVersion(gameId, version._id);
    }

    // Set publishedAt if this is the first time publishing
    if (!game.publishedAt) {
      await gameRepo.setPublishedAt(gameId);
    }

    // Sync Public Registry
    try {
      await PublicRegistryManager.sync();
    } catch (syncError) {
      console.error('[Publish] Failed to sync Public Registry:', syncError);
      // Don't fail the publish, just log the error
    }

    // Record history
    await GameHistoryService.recordStatusChange(gameId, user, oldStatus, 'published', {
      setAsLive,
      version: version.version,
    });

    // Notify owner
    await NotificationService.notifyGamePublished(
      game.ownerId,
      game.title || game.gameId,
      gameId
    );

    // Audit log
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
      action: 'GAME_STATUS_CHANGE',
      target: {
        entity: 'GAME_VERSION',
        id: targetVersionId,
      },
      changes: [
        { field: 'status', oldValue: oldStatus, newValue: 'published' },
      ],
      metadata: {
        gameId: game.gameId,
        version: version.version,
        setAsLive: shouldSetLive,
        rolloutPercentage: rolloutPercentage ?? game.rolloutPercentage ?? 100,
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      version: updatedVersion,
      isLive: shouldSetLive,
      rolloutPercentage: rolloutPercentage ?? game.rolloutPercentage ?? 100,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Publish error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
