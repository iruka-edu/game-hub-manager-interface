/**
 * API Endpoint for Comprehensive QC Testing
 * 
 * This endpoint runs the complete QC test suite for mini games,
 * integrating AutoTestingService and MiniGameQCService for
 * comprehensive testing during QC approval process.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { QCTestSuite, QCTestReport } from '@/lib/MiniGameQCService';
import { GameRepository } from '@/models/Game';
import { GameVersionRepository, type QASummary } from '@/models/GameVersion';
import { QCReportRepository } from '@/models/QcReport';
import { UserRepository } from '@/models/User';
import { verifySession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check if user has QC permissions
    if (!user.roles.includes('qc') && !user.roles.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { gameId, versionId, testConfig } = body;

    if (!gameId || !versionId) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, versionId' },
        { status: 400 }
      );
    }

    // Get game and version information
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    const game = await gameRepo.findByGameId(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const version = await versionRepo.findById(versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Check if version is in correct status for QC testing
    if (!['uploaded', 'qc_processing'].includes(version.status)) {
      return NextResponse.json(
        { error: 'Version not ready for QC testing' },
        { status: 400 }
      );
    }

    // Update version status to qc_processing if needed
    if (version.status === 'uploaded') {
      await versionRepo.updateStatus(versionId, 'qc_processing');
    }

    // Construct game URL
    const gameUrl = `https://storage.googleapis.com/iruka-edu-mini-game/games/${gameId}/${version.version}/index.html`;

    // Prepare test suite
    const testSuite: QCTestSuite = {
      gameId,
      versionId,
      gameUrl,
      manifest: undefined, // GameVersion doesn't have manifest field
      testConfig: {
        userId: user._id.toString(),
        timeout: testConfig?.timeout || 120000,
        skipManualTests: testConfig?.skipManualTests || false,
        enableSDKDebugging: testConfig?.enableSDKDebugging !== false,
        testEnvironment: testConfig?.testEnvironment || 'staging',
        deviceSimulation: {
          mobile: testConfig?.deviceSimulation?.mobile !== false,
          tablet: testConfig?.deviceSimulation?.tablet !== false,
          desktop: testConfig?.deviceSimulation?.desktop !== false
        },
        performanceThresholds: {
          maxLoadTime: testConfig?.performanceThresholds?.maxLoadTime || 5000,
          minFrameRate: testConfig?.performanceThresholds?.minFrameRate || 30,
          maxMemoryUsage: testConfig?.performanceThresholds?.maxMemoryUsage || 100 * 1024 * 1024
        }
      }
    };

    console.log(`🧪 Starting comprehensive QC test for ${gameId} v${version.version}`);

    // Import server-only MiniGameQCService
    const { MiniGameQCService } = await import('@/lib/MiniGameQCService.server');

    // Run comprehensive QC test suite
    const testReport: QCTestReport = await MiniGameQCService.runQCTestSuite(testSuite);

    // Save QC report to database
    const qcReportRepo = await QCReportRepository.getInstance();
    
    // Build QA summary for the report
    const qaSummary: QASummary = {
      overall: testReport.overallResult === 'PASS' ? 'pass' : 'fail',
      categories: {
        sdk: {
          name: 'SDK Integration',
          tests: [
            { id: 'sdk_handshake', name: 'SDK Handshake', passed: testReport.qaResults.qa01.pass, notes: '', isAutoTest: true },
            { id: 'sdk_events', name: 'SDK Events', passed: testReport.qaResults.qa01.pass, notes: '', isAutoTest: true },
            { id: 'sdk_data_format', name: 'Data Format', passed: testReport.qaResults.qa02.pass, notes: '', isAutoTest: true }
          ]
        },
        performance: {
          name: 'Performance',
          tests: [
            { id: 'perf_load_time', name: 'Load Time', passed: !testReport.qaResults.qa03.auto.assetError, notes: '', isAutoTest: true },
            { id: 'perf_bundle_size', name: 'Bundle Size', passed: testReport.performanceMetrics.bundleSize < 20 * 1024 * 1024, notes: '', isAutoTest: true }
          ]
        },
        gameplay: {
          name: 'Gameplay',
          tests: [
            { id: 'game_idempotency', name: 'Idempotency', passed: testReport.qaResults.qa04.pass, notes: '', isAutoTest: true }
          ]
        }
      }
    };

    // Convert QA results to match expected types
    const qa01Result = {
      pass: testReport.qaResults.qa01.pass,
      initToReadyMs: testReport.qaResults.qa01.initToReadyMs,
      quitToCompleteMs: testReport.qaResults.qa01.quitToCompleteMs
    };

    const qa02Result = {
      pass: testReport.qaResults.qa02.pass,
      accuracy: testReport.qaResults.qa02.accuracy,
      completion: testReport.qaResults.qa02.completion,
      normalizedResult: testReport.qaResults.qa02.normalizedResult
    };

    const qa03Result = {
      auto: {
        assetError: testReport.qaResults.qa03.auto.assetError,
        readyMs: testReport.qaResults.qa03.auto.readyMs
      },
      manual: {
        noAutoplay: testReport.qaResults.qa03.manual.noAutoplay,
        noWhiteScreen: testReport.qaResults.qa03.manual.noWhiteScreen,
        gestureOk: testReport.qaResults.qa03.manual.gestureOk
      }
    };

    const qa04Result = {
      pass: testReport.qaResults.qa04.pass,
      duplicateAttemptId: testReport.qaResults.qa04.duplicateAttemptId,
      backendRecordCount: testReport.qaResults.qa04.backendRecordCount
    };

    const qcReport = await qcReportRepo.create({
      gameId: game._id,
      versionId: version._id,
      qcUserId: user._id,
      decision: testReport.overallResult === 'PASS' ? 'pass' : 'fail',
      notes: MiniGameQCService.generateReportSummary(testReport),
      qa01: qa01Result,
      qa02: qa02Result,
      qa03: qa03Result,
      qa04: qa04Result,
      qaSummary,
      rawResult: {
        sdkTestResults: testReport.sdkTestResults,
        performanceMetrics: testReport.performanceMetrics,
        deviceCompatibility: testReport.deviceCompatibility,
        recommendations: testReport.recommendations,
        warnings: testReport.warnings,
        criticalIssues: testReport.criticalIssues
      },
      testStartedAt: testReport.testTimestamp,
      testCompletedAt: new Date()
    });

    // Don't auto-update version status - let QC reviewer make the final decision
    // The auto tests are informational, not final

    console.log(`✅ QC test completed for ${gameId} v${version.version}: ${testReport.overallResult}`);

    return NextResponse.json({
      success: true,
      testReport,
      qcReportId: qcReport._id,
      summary: MiniGameQCService.generateReportSummary(testReport)
    });

  } catch (error) {
    console.error('❌ Comprehensive QC test failed:', error);
    
    return NextResponse.json(
      {
        error: 'QC test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve QC test status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('iruka_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const versionId = searchParams.get('versionId');

    if (!gameId || !versionId) {
      return NextResponse.json(
        { error: 'Missing required parameters: gameId, versionId' },
        { status: 400 }
      );
    }

    // Get latest QC report for this version
    const qcReportRepo = await QCReportRepository.getInstance();
    const reports = await qcReportRepo.findByVersionId(versionId);
    
    if (reports.length === 0) {
      return NextResponse.json({
        hasReport: false,
        message: 'No QC reports found for this version'
      });
    }

    // Get the latest report
    const latestReport = reports.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return NextResponse.json({
      hasReport: true,
      report: latestReport,
      summary: latestReport.notes
    });

  } catch (error) {
    console.error('Failed to get QC test status:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get QC test status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}