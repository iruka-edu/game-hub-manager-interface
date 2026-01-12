import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { QCReportRepository } from "@/models/QcReport";
import { getUserFromHeaders } from "@/lib/auth";
import { hasPermissionString } from "@/lib/auth-rbac";
import { AuditLogger } from "@/lib/audit";
import { NotificationService } from "@/lib/notification";
import { GameHistoryService } from "@/lib/game-history";
import type { QCDecision } from "@/models/QcReport";

/**
 * POST /api/qc/decision
 * Records QC pass/fail decision with supporting data
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermissionString(user, "games:review")) {
      return NextResponse.json(
        { error: "Forbidden - QC permission required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { versionId, decision, note, manualValidation, reportId } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: "versionId is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(versionId)) {
      return NextResponse.json(
        { error: "Invalid versionId format" },
        { status: 400 }
      );
    }

    if (!decision) {
      return NextResponse.json(
        { error: "decision is required" },
        { status: 400 }
      );
    }

    if (!["pass", "fail"].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be "pass" or "fail"' },
        { status: 400 }
      );
    }

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: "note is required and cannot be empty" },
        { status: 400 }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QCReportRepository.getInstance();

    const version = await versionRepo.findById(versionId);
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const game = await gameRepo.findById(version.gameId.toString());
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (version.status !== "qc_processing") {
      return NextResponse.json(
        {
          error: "Version is not in QC processing status",
          currentStatus: version.status,
          requiredStatus: "qc_processing",
        },
        { status: 400 }
      );
    }

    let qcReport;
    if (reportId) {
      if (!ObjectId.isValid(reportId)) {
        return NextResponse.json(
          { error: "Invalid reportId format" },
          { status: 400 }
        );
      }
      qcReport = await qcRepo.findById(reportId);
    } else {
      qcReport = await qcRepo.getLatestByVersionId(versionId);
    }

    if (!qcReport) {
      return NextResponse.json(
        {
          error:
            "No QC report found for this version. Please run QA testing first.",
        },
        { status: 404 }
      );
    }

    const qa01Pass = qcReport.qa01?.pass;
    const qa02Pass = qcReport.qa02?.pass;
    const qa04Pass = qcReport.qa04?.pass;

    if (decision === "pass") {
      if (!qa01Pass || !qa02Pass) {
        return NextResponse.json(
          {
            error: "Cannot pass QC when QA-01 or QA-02 tests failed",
            qa01Pass,
            qa02Pass,
            qa04Pass,
          },
          { status: 400 }
        );
      }

      if (!qa04Pass) {
        return NextResponse.json(
          {
            error: "Cannot pass QC when QA-04 idempotency test failed",
            qa04Pass,
          },
          { status: 400 }
        );
      }

      if (manualValidation) {
        const { noAutoplay, noWhiteScreen, gestureOk } = manualValidation;
        if (!noAutoplay || !noWhiteScreen || !gestureOk) {
          return NextResponse.json(
            {
              error: "Cannot pass QC when manual QA-03 validation failed",
              manualValidation: { noAutoplay, noWhiteScreen, gestureOk },
            },
            { status: 400 }
          );
        }
      }
    }

    try {
      const updatedQAResults = { ...qcReport };
      updatedQAResults.decision = decision as QCDecision;
      updatedQAResults.notes = note.trim();

      if (manualValidation) {
        if (!updatedQAResults.qa03) {
          return NextResponse.json(
            { error: "Cannot update manual validation: QA-03 results missing" },
            { status: 400 }
          );
        }
        updatedQAResults.qa03.manual = {
          noAutoplay: Boolean(manualValidation.noAutoplay),
          noWhiteScreen: Boolean(manualValidation.noWhiteScreen),
          gestureOk: Boolean(manualValidation.gestureOk),
        };
      }

      const finalReport = await qcRepo.create({
        gameId: qcReport.gameId,
        versionId: qcReport.versionId,
        qcUserId: new ObjectId(user._id.toString()),
        qa01: updatedQAResults.qa01,
        qa02: updatedQAResults.qa02,
        qa03: updatedQAResults.qa03,
        qa04: updatedQAResults.qa04,
        rawResult: qcReport.rawResult,
        eventsTimeline: qcReport.eventsTimeline,
        decision: decision as QCDecision,
        notes: note.trim(),
        testStartedAt: qcReport.testStartedAt,
        testCompletedAt: new Date(),
      });

      const newStatus = decision === "pass" ? "qc_passed" : "qc_failed";
      const updatedVersion = await versionRepo.updateStatus(
        versionId,
        newStatus
      );

      if (version.qaSummary) {
        const finalSummary = { ...version.qaSummary };
        if (manualValidation && finalSummary.qa03 && updatedQAResults.qa03) {
          finalSummary.qa03.manual = updatedQAResults.qa03.manual;
        }
        finalSummary.overall = decision as "pass" | "fail";
        await versionRepo.updateQASummary(versionId, finalSummary);
      }

      await GameHistoryService.recordQcResult(
        game._id.toString(),
        user,
        decision,
        note
      );

      await NotificationService.notifyQcResult(
        game.ownerId,
        game.title || game.gameId,
        game._id.toString(),
        decision,
        note
      );

      if (decision === "pass") {
        await NotificationService.notifyQcPassed(
          game.title || game.gameId,
          game._id.toString()
        );
      }

      AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || undefined,
        },
        action: "QC_DECISION",
        target: { entity: "GAME_VERSION", id: versionId },
        changes: [
          { field: "status", oldValue: version.status, newValue: newStatus },
        ],
        metadata: {
          gameId: game.gameId,
          version: version.version,
          decision,
          note,
          reportId: finalReport._id.toString(),
          qa01Pass,
          qa02Pass,
          qa04Pass,
          manualValidation: manualValidation || null,
        },
      });

      return NextResponse.json({
        success: true,
        decision,
        reportId: finalReport._id.toString(),
        version: {
          id: updatedVersion?._id.toString(),
          status: newStatus,
          qaSummary: version.qaSummary,
        },
        qaResults: {
          qa01: { pass: qa01Pass },
          qa02: { pass: qa02Pass },
          qa03: {
            auto: updatedQAResults.qa03?.auto,
            manual: updatedQAResults.qa03?.manual,
          },
          qa04: { pass: qa04Pass },
          overall: decision,
        },
      });
    } catch (updateError) {
      console.error("QC decision update failed:", updateError);
      return NextResponse.json(
        {
          error: "Failed to record QC decision",
          details:
            updateError instanceof Error
              ? updateError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("QC decision API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
