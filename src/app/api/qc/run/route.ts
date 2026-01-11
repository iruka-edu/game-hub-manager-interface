import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository } from '@/models/GameVersion';
import { QCReportRepository } from '@/models/QcReport';
import { getUserFromHeaders } from '@/lib/auth';
import { hasPermissionString } from '@/lib/auth-rbac';
import { AuditLogger } from '@/lib/audit';
import { TestRunnerService } from '@/lib/TestRunnerService';
import type { LaunchContext, QATestResults } from '@/types/qc-types';

/**
 * POST /api/qc/run
 * Initiates automated QA testing for a game version
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request.headers);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermissionString(user, 'games:review')) {
      return NextResponse.json(
        { error: 'Forbidden - QC permission required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { versionId, sessionId } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    if (!ObjectId.isValid(versionId)) {
      return NextResponse.json({ error: 'Invalid versionId format' }, { status: 400 });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QCReportRepository.getInstance();

    const version = await versionRepo.findById(versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const game = await gameRepo.findById(version.gameId.toString());
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (!['uploaded', 'qc_processing'].includes(version.status)) {
      return NextResponse.json(
        {
          error: 'Version is not available for QC testing',
          currentStatus: version.status,
          allowedStatuses: ['uploaded', 'qc_processing'],
        },
        { status: 400 }
      );
    }

    if (version.status === 'uploaded') {
      await versionRepo.updateStatus(versionId, 'qc_processing');
    }

    const launchContext: LaunchContext = {
      gameId: game._id.toString(),
      versionId: version._id.toString(),
      userId: user._id.toString(),
      sessionId: sessionId || `qc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    const entryUrl = `${
      process.env.GAME_STORAGE_BASE_URL || 'https://storage.googleapis.com/iruka-games'
    }/${version.storagePath}${version.entryFile}`;

    try {
      const mockIframe = {
        src: '',
        contentWindow: null,
        sandbox: 'allow-scripts allow-same-origin',
      } as unknown as HTMLIFrameElement;

      const qaResults: QATestResults = await TestRunnerService.runAutoQA({
        iframe: mockIframe,
        entryUrl,
        launchContext,
      });

      const qcReport = await qcRepo.create({
        gameId: version.gameId,
        versionId: version._id,
        qcUserId: new ObjectId(user._id.toString()),
        qa01: qaResults.qa01,
        qa02: qaResults.qa02,
        qa03: qaResults.qa03,
        qa04: qaResults.qa04,
        rawResult: qaResults.rawResult,
        eventsTimeline: qaResults.eventsTimeline.map((event) => ({
          type: event.type,
          timestamp: event.timestamp,
          data: event.data,
        })),
        decision: 'pass',
        note: 'Automated QA testing completed',
        testStartedAt: launchContext.timestamp,
        testCompletedAt: new Date(),
      });

      await versionRepo.updateQASummary(versionId, {
        qa01: {
          pass: qaResults.qa01.pass,
          initToReadyMs: qaResults.qa01.initToReadyMs,
          quitToCompleteMs: qaResults.qa01.quitToCompleteMs,
        },
        qa02: {
          pass: qaResults.qa02.pass,
          accuracy: qaResults.qa02.accuracy,
          completion: qaResults.qa02.completion,
          normalizedResult: qaResults.qa02.normalizedResult,
        },
        qa03: qaResults.qa03,
        qa04: {
          pass: qaResults.qa04.pass,
          duplicateAttemptId: qaResults.qa04.duplicateAttemptId,
          backendRecordCount: qaResults.qa04.backendRecordCount,
        },
        overall:
          qaResults.qa01.pass && qaResults.qa02.pass && qaResults.qa04.pass ? 'pass' : 'fail',
      });

      AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'QC_TEST_RUN',
        target: { entity: 'GAME_VERSION', id: versionId },
        metadata: {
          gameId: game.gameId,
          version: version.version,
          sessionId: launchContext.sessionId,
          testDuration: qaResults.testDuration,
          qa01Pass: qaResults.qa01.pass,
          qa02Pass: qaResults.qa02.pass,
          qa04Pass: qaResults.qa04.pass,
          overall:
            qaResults.qa01.pass && qaResults.qa02.pass && qaResults.qa04.pass ? 'pass' : 'fail',
        },
      });

      return NextResponse.json({
        success: true,
        sessionId: launchContext.sessionId,
        reportId: qcReport._id.toString(),
        results: {
          qa01: {
            pass: qaResults.qa01.pass,
            initToReadyMs: qaResults.qa01.initToReadyMs,
            quitToCompleteMs: qaResults.qa01.quitToCompleteMs,
          },
          qa02: {
            pass: qaResults.qa02.pass,
            accuracy: qaResults.qa02.accuracy,
            completion: qaResults.qa02.completion,
          },
          qa03: { auto: qaResults.qa03.auto, manual: qaResults.qa03.manual },
          qa04: {
            pass: qaResults.qa04.pass,
            duplicateAttemptId: qaResults.qa04.duplicateAttemptId,
            backendRecordCount: qaResults.qa04.backendRecordCount,
          },
          overall:
            qaResults.qa01.pass && qaResults.qa02.pass && qaResults.qa04.pass ? 'pass' : 'fail',
          testDuration: qaResults.testDuration,
          eventsCount: qaResults.eventsTimeline.length,
        },
      });
    } catch (testError) {
      console.error('QA testing failed:', testError);

      await versionRepo.updateStatus(versionId, 'uploaded');

      AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
        action: 'QC_TEST_FAILED',
        target: { entity: 'GAME_VERSION', id: versionId },
        metadata: {
          gameId: game.gameId,
          version: version.version,
          sessionId: launchContext.sessionId,
          error: testError instanceof Error ? testError.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        {
          error: 'QA testing failed',
          details: testError instanceof Error ? testError.message : 'Unknown error',
          sessionId: launchContext.sessionId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('QC run API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
