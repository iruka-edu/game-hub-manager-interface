import type { APIRoute } from 'astro';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { getUserFromRequest } from '../../../../lib/session';
import { hasPermissionString } from '../../../../auth/auth-rbac';
import { AuditLogger } from '../../../../lib/audit';
import { NotificationService } from '../../../../lib/notification';
import { GameHistoryService } from '../../../../lib/game-history';
import { VersionStateMachine } from '../../../../lib/version-state-machine';

/**
 * POST /api/games/[id]/approve
 * CTO/Admin approves a game version after QC pass
 * Changes version status: qc_passed -> approved
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
    if (!hasPermissionString(user, 'games:approve')) {
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
    } else if (!targetVersionId) {
      // Fallback: Find the most recent version for this game
      const versions = await versionRepo.findByGameId(gameId);
      if (versions.length === 0) {
        return new Response(JSON.stringify({ error: 'No version found for this game. Please upload a version first.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const latestVersion = versions[0];
      targetVersionId = latestVersion._id.toString();
      
      // Update game's latestVersionId for future calls
      await gameRepo.updateLatestVersion(gameId, latestVersion._id);
    }

    const version = await versionRepo.findById(targetVersionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use state machine for transition
    const stateMachine = await VersionStateMachine.getInstance();
    
    if (!stateMachine.canTransition(version.status, 'approve')) {
      return new Response(JSON.stringify({ 
        error: `Cannot approve version in "${version.status}" status. Only qc_passed versions can be approved.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const oldStatus = version.status;
    const updatedVersion = await stateMachine.transition(targetVersionId, 'approve', user._id.toString());

    // Record history
    await GameHistoryService.recordStatusChange(gameId, user, oldStatus, 'approved');

    // Notify owner
    await NotificationService.notifyGameApproved(
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
        { field: 'status', oldValue: oldStatus, newValue: 'approved' },
      ],
      metadata: {
        gameId: game.gameId,
        version: version.version,
      },
    });

    return new Response(JSON.stringify({ success: true, version: updatedVersion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Approve error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
