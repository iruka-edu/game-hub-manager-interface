/**
 * API Endpoint for Comprehensive QC Testing
 *
 * This endpoint runs the complete QC test suite for mini games,
 * integrating AutoTestingService and MiniGameQCService for
 * comprehensive testing during QC approval process.
 */

import { NextRequest, NextResponse } from "next/server";
// import { cookies } from 'next/headers';
import type { QCTestSuite, QCTestReport } from "@/lib/MiniGameQCService";
import {
  externalApiGet,
  externalApiPost,
  externalApiPut,
} from "@/lib/external-api";
import type { Game, GameVersion, QASummary } from "@/features/games/types";
// import { verifySession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    // [AUTH DISABLED BY REQUEST] - Using mock user
    /*
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
    */

    // Mock user for system/manual execution
    const user = {
      _id: "000000000000000000000000",
      roles: ["admin", "qc"],
      email: "system@qc.test",
      name: "System QC",
    };

    const body = await request.json();
    const { gameId, versionId, gameUrl, gameData, versionData, testConfig } =
      body;

    console.log("🔍 QC Test Request:", { gameId, versionId, gameUrl });

    if (!gameId || !versionId) {
      return NextResponse.json(
        { error: "Missing required fields: gameId, versionId" },
        { status: 400 },
      );
    }

    // Use game and version data from request body
    // This avoids issues when game hasn't been synced to external API yet

    const game: Game = gameData || {
      id: gameId,
      game_id: gameId,
      title: "Unknown Game",
      description: "",
      owner_id: "",
      status: "uploaded",
      meta_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const version: GameVersion = versionData || {
      id: versionId,
      game_id: gameId,
      version: "1.0.0",
      status: "uploaded",
      build_url: gameUrl || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("✅ Using game data:", {
      gameId: game.game_id,
      versionId: version.id,
    });

    // Check if version is in correct status for QC testing
    if (!["uploaded", "qc_processing"].includes(version.status || "")) {
      return NextResponse.json(
        { error: "Version not ready for QC testing" },
        { status: 400 },
      );
    }

    // Update version status to qc_processing if needed
    if (version.status === "uploaded") {
      try {
        await externalApiPut(`/api/v1/game-versions/${versionId}`, {
          status: "qc_processing",
        });
      } catch (e) {
        console.warn("Failed to update version status", e);
      }
    }

    // Prepare test suite
    const testSuite: QCTestSuite = {
      gameId,
      versionId,
      gameUrl:
        gameUrl ||
        `https://storage.googleapis.com/iruka-edu-mini-game/games/${gameId}/${version.version}/index.html`,
      manifest: undefined, // GameVersion doesn't have manifest field
      testConfig: {
        userId: user._id.toString(),
        timeout: testConfig?.timeout || 120000,
        skipManualTests: testConfig?.skipManualTests || false,
        enableSDKDebugging: testConfig?.enableSDKDebugging !== false,
        testEnvironment: testConfig?.testEnvironment || "staging",
        deviceSimulation: {
          mobile: testConfig?.deviceSimulation?.mobile !== false,
          tablet: testConfig?.deviceSimulation?.tablet !== false,
          desktop: testConfig?.deviceSimulation?.desktop !== false,
        },
        performanceThresholds: {
          maxLoadTime: testConfig?.performanceThresholds?.maxLoadTime || 5000,
          minFrameRate: testConfig?.performanceThresholds?.minFrameRate || 30,
          maxMemoryUsage:
            testConfig?.performanceThresholds?.maxMemoryUsage ||
            100 * 1024 * 1024,
        },
      },
    };

    console.log(
      `🧪 Starting comprehensive QC test for ${gameId} v${version.version}`,
    );

    // Import server-only MiniGameQCService
    const { MiniGameQCService } =
      await import("@/lib/MiniGameQCService.server");

    // Run comprehensive QC test suite
    const testReport: QCTestReport =
      await MiniGameQCService.runQCTestSuite(testSuite);

    // Save QC report to database via API
    // const qcReportRepo = await QCReportRepository.getInstance();

    // Build QA summary for the report
    const qaSummary: QASummary = {
      overall: testReport.overallResult === "PASS" ? "pass" : "fail",
      categories: {
        sdk: {
          name: "SDK Integration",
          tests: [
            {
              id: "sdk_handshake",
              name: "SDK Handshake",
              passed: testReport.qaResults.qa01.pass,
              notes: "",
              isAutoTest: true,
            },
            {
              id: "sdk_events",
              name: "SDK Events",
              passed: testReport.qaResults.qa01.pass,
              notes: "",
              isAutoTest: true,
            },
            {
              id: "sdk_data_format",
              name: "Data Format",
              passed: testReport.qaResults.qa02.pass,
              notes: "",
              isAutoTest: true,
            },
          ],
        },
        performance: {
          name: "Performance",
          tests: [
            {
              id: "perf_load_time",
              name: "Load Time",
              passed: !testReport.qaResults.qa03.auto.assetError,
              notes: "",
              isAutoTest: true,
            },
            {
              id: "perf_bundle_size",
              name: "Bundle Size",
              passed:
                testReport.performanceMetrics.bundleSize < 20 * 1024 * 1024,
              notes: "",
              isAutoTest: true,
            },
          ],
        },
        gameplay: {
          name: "Gameplay",
          tests: [
            {
              id: "game_idempotency",
              name: "Idempotency",
              passed: testReport.qaResults.qa04.pass,
              notes: "",
              isAutoTest: true,
            },
          ],
        },
      },
    };

    // Convert QA results to match expected types
    const qa01Result = {
      pass: testReport.qaResults.qa01.pass,
      initToReadyMs: testReport.qaResults.qa01.initToReadyMs,
      quitToCompleteMs: testReport.qaResults.qa01.quitToCompleteMs,
    };

    const qa02Result = {
      pass: testReport.qaResults.qa02.pass,
      accuracy: testReport.qaResults.qa02.accuracy,
      completion: testReport.qaResults.qa02.completion,
      normalizedResult: testReport.qaResults.qa02.normalizedResult,
    };

    const qa03Result = {
      auto: {
        assetError: testReport.qaResults.qa03.auto.assetError,
        readyMs: testReport.qaResults.qa03.auto.readyMs,
      },
      manual: {
        noAutoplay: testReport.qaResults.qa03.manual.noAutoplay,
        noWhiteScreen: testReport.qaResults.qa03.manual.noWhiteScreen,
        gestureOk: testReport.qaResults.qa03.manual.gestureOk,
      },
    };

    const qa04Result = {
      pass: testReport.qaResults.qa04.pass,
      duplicateAttemptId: testReport.qaResults.qa04.duplicateAttemptId,
      backendRecordCount: testReport.qaResults.qa04.backendRecordCount,
    };

    // Prepare report payload
    const reportPayload = {
      gameId: game.id,
      versionId: version.id,
      qcUserId: user._id,
      decision: testReport.overallResult === "PASS" ? "pass" : "fail",
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
        criticalIssues: testReport.criticalIssues,
      },
      testStartedAt: testReport.testTimestamp,
      testCompletedAt: new Date(),
    };

    let qcReport: any;
    try {
      qcReport = await externalApiPost("/api/v1/qc/reports", reportPayload);
    } catch (e) {
      console.error("Failed to save QC report to API", e);
      // We might still want to return the test result, but let's error for now to be safe
      throw e;
    }

    // Don't auto-update version status - let QC reviewer make the final decision
    // The auto tests are informational, not final

    console.log(
      `✅ QC test completed for ${gameId} v${version.version}: ${testReport.overallResult}`,
    );

    return NextResponse.json({
      success: true,
      testReport,
      qcReportId: qcReport._id,
      summary: MiniGameQCService.generateReportSummary(testReport),
    });
  } catch (error) {
    console.error("❌ Comprehensive QC test failed:", error);

    return NextResponse.json(
      {
        error: "QC test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
