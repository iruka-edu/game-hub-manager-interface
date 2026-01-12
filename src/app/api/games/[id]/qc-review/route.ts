import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { hasPermissionString } from "@/lib/auth-rbac";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { QCReportRepository } from "@/models/QcReport";
import { AuditLogger } from "@/lib/audit";
import { GameHistoryService } from "@/lib/game-history";

/**
 * POST /api/games/[id]/qc-review
 * Submit QC review for a game version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    console.log("[QC Review] Starting review for game:", gameId);

    // Auth check using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("iruka_session");

    if (!sessionCookie?.value) {
      console.log("[QC Review] No session cookie");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      console.log("[QC Review] Invalid session");
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);

    if (!user) {
      console.log("[QC Review] User not found:", session.userId);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Check if user has QC or Admin permission
    const hasQCPermission = hasPermissionString(user, "games:review");
    if (!hasQCPermission) {
      console.log("[QC Review] Permission denied:", user._id.toString());
      return NextResponse.json(
        { error: "You do not have permission to review games" },
        { status: 403 }
      );
    }

    if (!gameId || !ObjectId.isValid(gameId)) {
      console.log("[QC Review] Invalid game ID:", gameId);
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { versionId, decision, qaSummary, notes, reviewerName } = body;

    if (!versionId || !ObjectId.isValid(versionId)) {
      return NextResponse.json(
        { error: "Invalid version ID" },
        { status: 400 }
      );
    }

    if (!decision || !["pass", "fail"].includes(decision)) {
      return NextResponse.json(
        { error: 'Decision must be "pass" or "fail"' },
        { status: 400 }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const qcRepo = await QCReportRepository.getInstance();

    const game = await gameRepo.findById(gameId);
    if (!game) {
      console.log("[QC Review] Game not found:", gameId);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const version = await versionRepo.findById(versionId);
    if (!version) {
      console.log("[QC Review] Version not found:", versionId);
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    console.log(
      "[QC Review] Found version:",
      version.version,
      "Status:",
      version.status
    );

    // Check if version can be reviewed
    if (version.status !== "uploaded") {
      console.log("[QC Review] Invalid status for review:", version.status);
      return NextResponse.json(
        {
          error: `Cannot review version with status: ${version.status}. Only uploaded versions can be reviewed.`,
        },
        { status: 400 }
      );
    }

    // Determine new status based on decision
    const newStatus = decision === "pass" ? "qc_passed" : "qc_failed";

    // Update version status
    const updatedVersion = await versionRepo.update(versionId, {
      status: newStatus,
      qaSummary,
      updatedAt: new Date(),
    });

    if (!updatedVersion) {
      throw new Error("Failed to update version status");
    }

    console.log("[QC Review] Version updated to status:", newStatus);

    // Create QC report
    const qcReport = await qcRepo.create({
      gameId: new ObjectId(gameId),
      versionId: new ObjectId(versionId),
      qcUserId: user._id,
      reviewerName: reviewerName || user.name || user.email,
      decision,
      qaSummary,
      notes,
      reviewedAt: new Date(),
    });

    console.log("[QC Review] QC report created:", qcReport._id.toString());

    // Log audit event
    await AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: decision === "pass" ? "GAME_QC_PASS" : "GAME_QC_FAIL",
      target: {
        entity: "GAME_VERSION",
        id: versionId,
      },
      metadata: {
        gameId: game.gameId,
        version: version.version,
        previousStatus: version.status,
        newStatus,
        decision,
        qaSummary,
      },
    });

    // Add history entry
    await GameHistoryService.addEntry(
      gameId,
      decision === "pass"
        ? `QC Pass - Version ${version.version}`
        : `QC Fail - Version ${version.version}`,
      user,
      versionId,
      newStatus,
      {
        action: "qc_review",
        version: version.version,
        decision,
        reviewedBy: reviewerName || user.name || user.email,
        notes,
      }
    );

    console.log("[QC Review] Successfully submitted review");

    return NextResponse.json(
      {
        success: true,
        message: `QC review submitted successfully. Game ${
          decision === "pass" ? "passed" : "failed"
        } QC.`,
        data: {
          version: {
            _id: updatedVersion._id.toString(),
            status: updatedVersion.status,
          },
          report: {
            _id: qcReport._id.toString(),
            decision: qcReport.decision,
            reviewedAt:
              qcReport.reviewedAt?.toISOString() || new Date().toISOString(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[QC Review] API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
