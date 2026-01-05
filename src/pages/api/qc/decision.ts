import type { APIRoute } from "astro";
import { ObjectId } from "mongodb";
import { GameRepository } from "../../../models/Game";
import { GameVersionRepository } from "../../../models/GameVersion";
import { QCReportRepository } from "../../../models/QCReport";
import { getUserFromRequest } from "../../../lib/session";
import { hasPermissionString } from "../../../auth/auth-rbac";
import { AuditLogger } from "../../../lib/audit";
import { NotificationService } from "../../../lib/notification";
import { GameHistoryService } from "../../../lib/game-history";
import type { QCDecision } from "../../../models/QCReport";

/**
 * POST /api/qc/decision
 * Records QC pass/fail decision with supporting data
 *
 * Body:
 * - versionId: string (required) - The game version being decided on
 * - decision: 'pass' | 'fail' (required) - The QC decision
 * - note: string (required) - QC notes explaining the decision
 * - manualValidation?: object - Manual QA-03 validation results
 * - reportId?: string - Specific QC report to update (optional, uses latest if not provided)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check QC permission
    if (!hasPermissionString(user, "games:review")) {
      return new Response(
        JSON.stringify({ error: "Forbidden - QC permission required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { versionId, decision, note, manualValidation, reportId } = body;

    // Validate required fields
    if (!versionId) {
      return new Response(JSON.stringify({ error: "versionId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!ObjectId.isValid(versionId)) {
      return new Response(
        JSON.stringify({ error: "Invalid versionId format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!decision) {
      return new Response(JSON.stringify({ error: "decision is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["pass", "fail"].includes(decision)) {
      return new Response(
        JSON.stringify({ error: 'decision must be "pass" or "fail"' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!note || !note.trim()) {
      return new Response(
        JSON.stringify({ error: "note is required and cannot be empty" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get repositories
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QCReportRepository.getInstance();

    // Get the version
    const version = await versionRepo.findById(versionId);
    if (!version) {
      return new Response(JSON.stringify({ error: "Version not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the game
    const game = await gameRepo.findById(version.gameId.toString());
    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check version status - must be qc_processing
    if (version.status !== "qc_processing") {
      return new Response(
        JSON.stringify({
          error: "Version is not in QC processing status",
          currentStatus: version.status,
          requiredStatus: "qc_processing",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the QC report to update
    let qcReport;
    if (reportId) {
      if (!ObjectId.isValid(reportId)) {
        return new Response(
          JSON.stringify({ error: "Invalid reportId format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      qcReport = await qcRepo.findById(reportId);
    } else {
      // Get the latest QC report for this version
      qcReport = await qcRepo.getLatestByVersionId(versionId);
    }

    if (!qcReport) {
      return new Response(
        JSON.stringify({
          error:
            "No QC report found for this version. Please run QA testing first.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate decision logic based on QA results
    const qa01Pass = qcReport.qa01.pass;
    const qa02Pass = qcReport.qa02.pass;
    const qa04Pass = qcReport.qa04.pass;

    // Check if decision is consistent with automated test results
    if (decision === "pass") {
      if (!qa01Pass || !qa02Pass) {
        return new Response(
          JSON.stringify({
            error: "Cannot pass QC when QA-01 or QA-02 tests failed",
            qa01Pass,
            qa02Pass,
            qa04Pass,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!qa04Pass) {
        return new Response(
          JSON.stringify({
            error: "Cannot pass QC when QA-04 idempotency test failed",
            qa04Pass,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check manual validation for QA-03 if provided
      if (manualValidation) {
        const { noAutoplay, noWhiteScreen, gestureOk } = manualValidation;
        if (!noAutoplay || !noWhiteScreen || !gestureOk) {
          return new Response(
            JSON.stringify({
              error: "Cannot pass QC when manual QA-03 validation failed",
              manualValidation: { noAutoplay, noWhiteScreen, gestureOk },
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    try {
      // Update QC report with decision
      const updatedQAResults = { ...qcReport };
      updatedQAResults.decision = decision as QCDecision;
      updatedQAResults.note = note.trim();

      // Update manual validation if provided
      if (manualValidation) {
        updatedQAResults.qa03.manual = {
          noAutoplay: Boolean(manualValidation.noAutoplay),
          noWhiteScreen: Boolean(manualValidation.noWhiteScreen),
          gestureOk: Boolean(manualValidation.gestureOk),
        };
      }

      // Create new QC report with updated decision (preserving audit trail)
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
        note: note.trim(),
        testStartedAt: qcReport.testStartedAt,
        testCompletedAt: new Date(),
      });

      // Update version status based on decision
      const newStatus = decision === "pass" ? "qc_passed" : "qc_failed";
      const updatedVersion = await versionRepo.updateStatus(
        versionId,
        newStatus
      );

      // Update QA summary with final results
      if (version.qaSummary) {
        const finalSummary = { ...version.qaSummary };
        if (manualValidation) {
          finalSummary.qa03.manual = updatedQAResults.qa03.manual;
        }
        finalSummary.overall = decision as "pass" | "fail";
        await versionRepo.updateQASummary(versionId, finalSummary);
      }

      // Record history
      await GameHistoryService.recordQcResult(
        game._id.toString(),
        user,
        decision,
        note
      );

      // Send notifications
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

      // Audit log
      AuditLogger.log({
        actor: {
          user,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || undefined,
        },
        action: "QC_DECISION",
        target: {
          entity: "GAME_VERSION",
          id: versionId,
        },
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

      return new Response(
        JSON.stringify({
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
              auto: updatedQAResults.qa03.auto,
              manual: updatedQAResults.qa03.manual,
            },
            qa04: { pass: qa04Pass },
            overall: decision,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (updateError) {
      console.error("QC decision update failed:", updateError);

      return new Response(
        JSON.stringify({
          error: "Failed to record QC decision",
          details:
            updateError instanceof Error
              ? updateError.message
              : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("QC decision API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
