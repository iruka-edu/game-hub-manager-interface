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
 * POST /api/games/[id]/submit-qc
 * Submit game version to QC queue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    console.log("[Submit QC] Starting submit for game:", gameId);

    // Auth check using cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("iruka_session");

    if (!sessionCookie?.value) {
      console.log("[Submit QC] No session cookie");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifySession(sessionCookie.value);
    if (!session) {
      console.log("[Submit QC] Invalid session");
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userRepo = await UserRepository.getInstance();
    const user = await userRepo.findById(session.userId);

    if (!user) {
      console.log("[Submit QC] User not found:", session.userId);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (!gameId || !ObjectId.isValid(gameId)) {
      console.log("[Submit QC] Invalid game ID:", gameId);
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    const game = await gameRepo.findById(gameId);
    if (!game) {
      console.log("[Submit QC] Game not found:", gameId);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    console.log("[Submit QC] Found game:", game.gameId);

    // Check permissions
    const isOwner = game.ownerId === user._id.toString();
    const canSubmit = isOwner || hasPermissionString(user, "games:submit");

    if (!canSubmit) {
      console.log("[Submit QC] Permission denied:", {
        isOwner,
        userId: user._id.toString(),
        gameOwner: game.ownerId,
      });
      return NextResponse.json(
        { error: "You can only submit your own games to QC" },
        { status: 403 }
      );
    }

    // Get latest version
    if (!game.latestVersionId) {
      console.log("[Submit QC] No version found for game:", gameId);
      return NextResponse.json(
        { error: "No version found for this game" },
        { status: 400 }
      );
    }

    const version = await versionRepo.findById(game.latestVersionId.toString());
    if (!version) {
      console.log(
        "[Submit QC] Version not found:",
        game.latestVersionId.toString()
      );
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Check if version can be submitted
    const validStatuses = ["draft", "qc_failed"];
    if (!validStatuses.includes(version.status)) {
      console.log("[Submit QC] Invalid status for submission:", version.status);
      return NextResponse.json(
        {
          error: `Cannot submit version with status: ${version.status}. Only draft or qc_failed versions can be submitted.`,
        },
        { status: 400 }
      );
    }

    // Check if Self-QA is complete
    const selfQA = version.selfQAChecklist;
    if (
      !selfQA ||
      !selfQA.testedDevices ||
      !selfQA.testedAudio ||
      !selfQA.gameplayComplete ||
      !selfQA.contentVerified
    ) {
      console.log("[Submit QC] Self-QA not complete:", selfQA);
      return NextResponse.json(
        {
          error:
            "Self-QA checklist must be 100% complete before submitting to QC",
        },
        { status: 400 }
      );
    }

    // Update version status to 'uploaded' (submitted to QC queue)
    const updatedVersion = await versionRepo.update(version._id.toString(), {
      status: "uploaded",
      submittedBy: user._id,
      submittedAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("[Submit QC] Version updated to uploaded status");

    // Log audit event
    await AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_SUBMIT_QC",
      target: {
        entity: "GAME_VERSION",
        id: version._id.toString(),
      },
      metadata: {
        gameId: game.gameId,
        version: version.version,
        previousStatus: version.status,
        newStatus: "uploaded",
      },
    });

    // Add history entry
    await GameHistoryService.addEntry(
      gameId,
      `Gửi QC - Version ${version.version}`,
      user,
      version._id.toString(),
      "uploaded",
      {
        action: "submit_qc",
        version: version.version,
        submittedBy: user.name,
      }
    );

    console.log("[Submit QC] Successfully submitted to QC");

    return NextResponse.json(
      {
        success: true,
        message: "Game submitted to QC successfully",
        data: {
          version: {
            _id: updatedVersion._id.toString(),
            status: updatedVersion.status,
            submittedBy: updatedVersion.submittedBy?.toString(),
            submittedAt: updatedVersion.submittedAt?.toISOString(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Submit QC] API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
