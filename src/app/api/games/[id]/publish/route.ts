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
 * POST /api/games/[id]/publish
 * Publish a game version (Admin only)
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
    const canPublish = hasPermissionString(user, "games:publish");

    if (!canPublish) {
      return NextResponse.json(
        { error: "You do not have permission to publish games" },
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
        { error: "Game has no version to publish" },
        { status: 400 }
      );
    }

    const version = await versionRepo.findById(game.latestVersionId.toString());
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Check status
    if (version.status !== "approved") {
      return NextResponse.json(
        {
          error: `Cannot publish version with status: ${version.status}. Status must be 'approved'.`,
        },
        { status: 400 }
      );
    }

    // Update version status
    await versionRepo.updateStatus(version._id.toString(), "published");

    // Update game live version
    await gameRepo.update(gameId, {
      liveVersionId: version._id,
      publishedAt: new Date(),
    });

    // Log Audit
    await AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_PUBLISH" as any,
      target: {
        entity: "GAME_VERSION",
        id: version._id.toString(),
      },
      metadata: {
        gameId: game.gameId,
        version: version.version,
        previousStatus: version.status,
        newStatus: "published",
      },
    });

    // Add History
    await GameHistoryService.addEntry(
      gameId,
      `Đã xuất bản phiên bản ${version.version}`,
      user,
      version.status,
      "published",
      {
        action: "publish",
        publishedBy: user.email,
        versionId: version._id.toString(),
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        status: "published",
        version: version.version,
      },
    });
  } catch (error: any) {
    console.error(`[Game Publish] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
