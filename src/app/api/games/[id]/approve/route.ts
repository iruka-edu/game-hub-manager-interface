import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { hasPermissionString } from "@/lib/auth-rbac";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { AuditLogger } from "@/lib/audit";
import { GameHistoryService } from "@/lib/game-history";

/**
 * POST /api/games/[id]/approve
 * Approve or Reject a game version (CTO/CEO/Admin)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    // Auth check using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("iruka_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Check permission
    const canApprove = hasPermissionString(user, "games:approve");
    if (!canApprove) {
      return NextResponse.json(
        { error: "You do not have permission to approve games" },
        { status: 403 }
      );
    }

    if (!gameId || !ObjectId.isValid(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    const game = await gameRepo.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (!game.latestVersionId) {
      return NextResponse.json(
        { error: "Game has no version to approve" },
        { status: 400 }
      );
    }

    const version = await versionRepo.findById(game.latestVersionId.toString());
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Parse body optionally for decision/notes, defaulting to "approve" if empty
    // But GameActions might send empty body for simple button click?
    // Let's assume default is approve if no body, or check body.
    let decision = "approve";
    let notes = "";

    try {
      const body = await request.json();
      if (body.decision) decision = body.decision;
      if (body.notes) notes = body.notes;
    } catch {
      // Empty body is fine, treat as approve
    }

    if (!["approve", "reject"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    // Check valid valid statuses
    const validStatuses = ["uploaded", "qc_passed", "qc_failed", "draft"];

    if (version.status === "published" || version.status === "archived") {
      return NextResponse.json(
        {
          error: `Cannot ${decision} version with status: ${version.status}`,
        },
        { status: 400 }
      );
    }

    let newStatus: string;
    let actionType: string;

    if (decision === "approve") {
      newStatus = "approved";
      actionType = "GAME_APPROVE";
    } else {
      newStatus = "qc_failed"; // Rejecting leads to failed/needs fix
      actionType = "GAME_REJECT"; // Or QC_FAIL equivalent
    }

    // Update version status
    await versionRepo.updateStatus(version._id.toString(), newStatus as any);

    // Log Audit
    await AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: actionType as any,
      target: {
        entity: "GAME_VERSION",
        id: version._id.toString(),
      },
      metadata: {
        gameId: game.gameId,
        version: version.version,
        previousStatus: version.status,
        newStatus,
        notes,
        decision,
      },
    });

    // Add History
    await GameHistoryService.addEntry(
      gameId,
      decision === "approve"
        ? `Đã duyệt phiên bản ${version.version}`
        : `Đã từ chối phiên bản ${version.version}`,
      user,
      version.status,
      newStatus as any,
      {
        action: decision,
        notes,
        reviewedBy: user.email,
        versionId: version._id.toString(), // Added: Pass versionId in metadata
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        status: newStatus,
        version: version.version,
      },
    });
  } catch (error: any) {
    console.error(`[Game ${request.method}] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
