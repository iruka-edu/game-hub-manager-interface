import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { GameRepository } from '../../../models/Game';
import { GameVersionRepository } from '../../../models/GameVersion';
import { QCReportRepository } from '../../../models/QCReport';
import { getUserFromRequest } from '../../../lib/session';
import { hasPermissionString } from '../../../auth/auth-rbac';
import { AuditLogger } from '../../../lib/audit';
import { TestRunnerService } from '../../../services/TestRunnerService';
import type { LaunchContext, QATestResults } from '../../../types/qc-types';

/**
 * POST /api/qc/run
 * Initiates automated QA testing for a game version
 * 
 * Body:
 * - versionId: string (required) - The game version to test
 * - sessionId?: string (optional) - Custom session ID for tracking
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

    // Check QC permission
    if (!hasPermissionString(user, 'games:review')) {
      return new Response(JSON.stringify({ error: 'Forbidden - QC permission required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { versionId, sessionId } = body;

    // Validate required fields
    if (!versionId) {
      return new Response(JSON.stringify({ error: 'versionId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ObjectId.isValid(versionId)) {
      return new Response(JSON.stringify({ error: 'Invalid versionId format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get repositories
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QCReportRepository.getInstance();

    // Get the version
    const version = await versionRepo.findById(versionId);
    if (!version) {
      return new Response(JSON.stringify({ error: 'Version not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the game
    const game = await gameRepo.findById(version.gameId.toString());
    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check version status - must be uploaded or qc_processing
    if (!['uploaded', 'qc_processing'].includes(version.status)) {
      return new Response(JSON.stringify({ 
        error: 'Version is not available for QC testing',
        currentStatus: version.status,
        allowedStatuses: ['uploaded', 'qc_processing']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update version status to qc_processing if needed
    if (version.status === 'uploaded') {
      await versionRepo.updateStatus(versionId, 'qc_processing');
    }

    // Create launch context
    const launchContext: LaunchContext = {
      gameId: game._id.toString(),
      versionId: version._id.toString(),
      userId: user._id.toString(),
      sessionId: sessionId || `qc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Construct entry URL
    const entryUrl = `${process.env.GAME_STORAGE_BASE_URL || 'https://storage.googleapis.com/iruka-games'}/${version.storagePath}${version.entryFile}`;

    try {
      // Note: In a real implementation, this would create an actual iframe
      // For now, we'll simulate the QA testing process
      const mockIframe = {
        src: '',
        contentWindow: null,
        sandbox: 'allow-scripts allow-same-origin'
      } as HTMLIFrameElement;

      // Run automated QA testing
      const qaResults: QATestResults = await TestRunnerService.runAutoQA({
        iframe: mockIframe,
        entryUrl,
        launchContext
      });

      // Create QC report
      const qcReport = await qcRepo.create({
        gameId: version.gameId,
        versionId: version._id,
        qcUserId: new ObjectId(user._id.toString()),
        qa01: qaResults.qa01,
        qa02: qaResults.qa02,
        qa03: qaResults.qa03,
        qa04: qaResults.qa04,
        rawResult: qaResults.rawResult,
        eventsTimeline: qaResults.eventsTimeline.map(event => ({
          type: event.type,
          timestamp: event.timestamp,
          data: event.data
        })),
        decision: 'pass', // Will be updated by decision endpoint
        note: 'Automated QA testing completed',
        testStartedAt: launchContext.timestamp,
        testCompletedAt: new Date()
      });

      // Update game version with QA summary
      await versionRepo.updateQASummary(versionId, {
        qa01: {
          pass: qaResults.qa01.pass,
          initToReadyMs: qaResults.qa01.initToReadyMs,
          quitToCompleteMs: qaResults.qa01.quitToCompleteMs
        },
        qa02: {
          pass: qaResults.qa02.pass,
          accuracy: qaResults.qa02.accuracy,
          completion: qaResults.qa02.completion,
          normalizedResult: qaResults.qa02.normalizedResult
        },
        qa03: qaResults.qa03,
        qa04: {
          pass: qaResults.qa04.pass,
          duplicateAttemptId: qaResults.qa04.duplicateAttemptId,
          backendRecordCount: qaResults.qa04.backendRecordCount
        },
        overall: (qaResults.qa01.pass && qaResults.qa02.pass && qaResults.qa04.pass) ? 'pass' : 'fail'
      });

      // Audit log
      AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'QC_TEST_RUN',
        target: {
          entity: 'GAME_VERSION',
          id: versionId,
        },
        metadata: {
          gameId: game.gameId,
          version: version.version,
          sessionId: launchContext.sessionId,
          testDuration: qaResults.testDuration,
          qa01Pass: qaResults.qa01.pass,
          qa02Pass: qaResults.qa02.pass,
          qa04Pass: qaResults.qa04.pass,
          overall: (qaResults.qa01.pass && qaResults.qa02.pass && qaResults.qa04.pass) ? 'pass' : 'fail'
        },
      });

      return new Response(JSON.stringify({
        success: true,
        sessionId: launchContext.sessionId,
        reportId: qcReport._id.toString(),
        results: {
          qa01: {
            pass: qaResults.qa01.pass,
            initToReadyMs: qaResults.qa01.initToReadyMs,
            quitToCompleteMs: qaResults.qa01.quitToCompleteMs
          },
          qa02: {
            pass: qaResults.qa02.pass,
            accuracy: qaResults.qa02.accuracy,
            completion: qaResults.qa02.completion
          },
          qa03: {
            auto: qaResults.qa03.auto,
            manual: qaResults.qa03.manual
          },
          qa04: {
            pass: qaResults.qa04.pass,
            duplicateAttemptId: qaResults.qa04.duplicateAttemptId,
            backendRecordCount: qaResults.qa04.backendRecordCount
          },
          overall: (qaResults.qa01.pass && qaResults.qa02.pass && qaResults.qa04.pass) ? 'pass' : 'fail',
          testDuration: qaResults.testDuration,
          eventsCount: qaResults.eventsTimeline.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (testError) {
      console.error('QA testing failed:', testError);
      
      // Update version status back to uploaded on failure
      await versionRepo.updateStatus(versionId, 'uploaded');

      // Audit log for failure
      AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'QC_TEST_FAILED',
        target: {
          entity: 'GAME_VERSION',
          id: versionId,
        },
        metadata: {
          gameId: game.gameId,
          version: version.version,
          sessionId: launchContext.sessionId,
          error: testError instanceof Error ? testError.message : 'Unknown error'
        },
      });

      return new Response(JSON.stringify({
        error: 'QA testing failed',
        details: testError instanceof Error ? testError.message : 'Unknown error',
        sessionId: launchContext.sessionId
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('QC run API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};