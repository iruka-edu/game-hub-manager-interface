import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { QcReportRepository, type QcChecklistItem, type Severity } from '../../../models/QcReport';
import { getUserFromRequest } from '../../../lib/session';
import { hasPermissionString } from '../../../auth/auth-rbac';
import { AuditLogger } from '../../../lib/audit';
import { NotificationService } from '../../../lib/notification';
import { GameHistoryService } from '../../../lib/game-history';
import { VersionStateMachine } from '../../../lib/version-state-machine';

/**
 * POST /api/games/qc-result
 * QC submits review result (pass/fail) for a game version
 * 
 * Accepts either:
 * - versionId: Submit result for specific version
 * - gameId: Submit result for latest version (backward compatible)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission
    if (!hasPermissionString(user, 'games:review')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { versionId, gameId, result, checklist, note, severity, evidenceUrls } = body;

    // Validate required fields
    if (!versionId && !gameId) {
      return new Response(JSON.stringify({ error: 'versionId or gameId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!result) {
      return new Response(JSON.stringify({ error: 'result is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['pass', 'fail'].includes(result)) {
      return new Response(JSON.stringify({ error: 'result must be "pass" or "fail"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate fail requirements
    if (result === 'fail') {
      if (!note || !note.trim()) {
        return new Response(JSON.stringify({ error: 'Note is required when failing a game' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!severity) {
        return new Response(JSON.stringify({ error: 'Severity is required when failing a game' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QcReportRepository.getInstance();

    let targetVersionId = versionId;
    let game;

    // If gameId provided, get the latest version
    if (!targetVersionId && gameId) {
      game = await gameRepo.findById(gameId);
      if (!game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Try to get latest version from Game.latestVersionId first
      if (game.latestVersionId) {
        targetVersionId = game.latestVersionId.toString();
      } else {
        // Fallback: Find the most recent version for this game
        const versions = await versionRepo.findByGameId(gameId);
        if (versions.length === 0) {
          return new Response(JSON.stringify({ error: 'No version found for this game. Please upload a version first.' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        // Get the most recent version (versions are sorted by createdAt desc)
        const latestVersion = versions[0];
        targetVersionId = latestVersion._id.toString();
        
        // Update game's latestVersionId for future calls
        await gameRepo.updateLatestVersion(gameId, latestVersion._id);
      }
    }

    // Get the version
    const version = await versionRepo.findById(targetVersionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get game if not already loaded
    if (!game) {
      game = await gameRepo.findById(version.gameId.toString());
      if (!game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Check current status - must be uploaded or qc_processing
    if (!['uploaded', 'qc_processing'].includes(version.status)) {
      return new Response(JSON.stringify({ error: 'Version is not in QC review status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get QC attempt count
    const attemptCount = await qcRepo.countAttempts(game._id.toString());

    // Create QC report with version linkage
    const now = new Date();
    await qcRepo.create({
      gameId: game._id,
      versionId: version._id,
      reviewerId: new ObjectId(user._id.toString()),
      reviewerEmail: user.email,
      startedAt: now, // In a real app, this would be tracked when QC starts
      finishedAt: now,
      result,
      checklist: checklist as QcChecklistItem[] || [],
      note,
      severity: severity as Severity,
      evidenceUrls,
      attemptNumber: attemptCount + 1,
    });

    // Use state machine for transition
    const stateMachine = await VersionStateMachine.getInstance();
    const action = result === 'pass' ? 'pass' : 'fail';
    
    // If version is in 'uploaded' status, first transition to 'qc_processing'
    if (version.status === 'uploaded') {
      await stateMachine.transition(targetVersionId, 'startReview', user._id.toString());
    }
    
    // Then transition to pass/fail
    const updatedVersion = await stateMachine.transition(targetVersionId, action, user._id.toString());

    // Record history
    await GameHistoryService.recordQcResult(game._id.toString(), user, result, note);

    // Send notifications
    await NotificationService.notifyQcResult(
      game.ownerId,
      game.title || game.gameId,
      game._id.toString(),
      result,
      note
    );

    if (result === 'pass') {
      await NotificationService.notifyQcPassed(game.title || game.gameId, game._id.toString());
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
        id: targetVersionId,
      },
      changes: [
        { field: 'status', oldValue: version.status, newValue: updatedVersion.status },
      ],
      metadata: { 
        gameId: game.gameId,
        version: version.version,
        result, 
        severity, 
        note,
        attemptNumber: attemptCount + 1,
      },
    });

    return new Response(JSON.stringify({ success: true, version: updatedVersion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('QC result error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
