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
 * POST /api/games/[id]/reject
 * CTO/Admin rejects a game version and sends it back to dev
 * Changes version status: qc_passed/approved -> qc_failed
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
    const { versionId, note } = body;

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

    // Check current status - can reject from qc_passed or approved
    if (!['qc_passed', 'approved'].includes(version.status)) {
      return new Response(JSON.stringify({ 
        error: `Cannot reject version in "${version.status}" status. Only qc_passed or approved versions can be rejected.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use state machine for transition
    const stateMachine = await VersionStateMachine.getInstance();
    
    // Use 'reject' action for qc_passed/approved, 'fail' for qc_processing
    const action = ['qc_passed', 'approved'].includes(version.status) ? 'reject' : 'fail';
    
    if (!stateMachine.canTransition(version.status, action)) {
      return new Response(JSON.stringify({ 
        error: `Cannot reject version in "${version.status}" status.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const oldStatus = version.status;
    const updatedVersion = await stateMachine.transition(targetVersionId, action, user._id.toString());

    // Record history
    await GameHistoryService.recordStatusChange(gameId, user, oldStatus, 'qc_failed', note);

    // Notify owner
    await NotificationService.notifyGameRejected(
      game.ownerId,
      game.title || game.gameId,
      gameId,
      note || 'No reason provided'
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
        { field: 'status', oldValue: oldStatus, newValue: 'qc_failed' },
      ],
      metadata: {
        gameId: game.gameId,
        version: version.version,
        rejectionNote: note,
      },
    });

    return new Response(JSON.stringify({ success: true, version: updatedVersion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reject error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};