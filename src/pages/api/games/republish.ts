import type { APIRoute } from 'astro';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { getUserFromRequest } from '../../../lib/session';
import { hasPermissionString } from '../../../auth/auth-rbac';
import { AuditLogger } from '../../../lib/audit';
import { PublicRegistryManager } from '../../../lib/public-registry';
import { VersionStateMachine } from '../../../lib/version-state-machine';

/**
 * POST /api/games/republish
 * Admin republishes an archived game version
 * Changes version status: archived -> published
 * Restores game to Public Registry
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check permission
    if (!hasPermissionString(user, 'games:publish')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { gameId, versionId } = body;

    if (!gameId) {
      return new Response(JSON.stringify({ error: 'gameId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if game is disabled
    if (game.disabled) {
      return new Response(JSON.stringify({ error: 'Cannot republish disabled game. Enable the game first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get target version
    if (!versionId) {
      return new Response(JSON.stringify({ error: 'versionId is required for republish' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const version = await versionRepo.findById(versionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use state machine for transition
    const stateMachine = await VersionStateMachine.getInstance();
    
    if (!stateMachine.canTransition(version.status, 'republish')) {
      return new Response(JSON.stringify({ 
        error: `Cannot republish version in "${version.status}" status. Only archived versions can be republished.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const oldStatus = version.status;
    const updatedVersion = await stateMachine.transition(versionId, 'republish', user._id.toString());

    // Set as live version
    await gameRepo.updateLiveVersion(gameId, version._id);

    // Sync Public Registry
    try {
      await PublicRegistryManager.sync();
    } catch (syncError) {
      console.error('[Republish] Failed to sync Public Registry:', syncError);
    }

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
        id: versionId,
      },
      changes: [
        { field: 'status', oldValue: oldStatus, newValue: 'published' },
      ],
      metadata: {
        gameId: game.gameId,
        version: version.version,
        action: 'republish',
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      version: updatedVersion,
      message: 'Game republished successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Republish error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
