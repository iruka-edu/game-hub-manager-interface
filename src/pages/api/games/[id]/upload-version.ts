import type { APIRoute } from "astro";
import { ObjectId } from "mongodb";
import { GameRepository } from "../../../../models/Game";
import { GameVersionRepository } from "../../../../models/GameVersion";
import { getUserFromRequest } from "../../../../lib/session";
import { hasPermissionString } from "../../../../auth/auth-rbac";
import { AuditLogger } from "../../../../lib/audit";
import { GameHistoryService } from "../../../../lib/game-history";
import { generateStoragePath } from "../../../../lib/storage-path";

/**
 * POST /api/games/[id]/upload-version
 * Create a new version for an existing game
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permission
    if (!hasPermissionString(user, "games:create")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const gameId = params.id;
    if (!gameId) {
      return new Response(JSON.stringify({ error: "Game ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check ownership
    if (game.ownerId !== user._id.toString()) {
      return new Response(JSON.stringify({ error: "Forbidden - not owner" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { version: manualVersion, releaseNote, entryFile, buildSize } = body;

    // Calculate next version or use manual version
    let versionNumber: string;
    if (manualVersion) {
      // Validate manual version format
      const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
      if (!semverRegex.test(manualVersion)) {
        return new Response(
          JSON.stringify({
            error: "Invalid version format. Must be SemVer (X.Y.Z)",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      versionNumber = manualVersion;
    } else {
      // Auto-increment version
      versionNumber = await versionRepo.getNextVersion(gameId);
    }

    // Generate storage path
    const storagePath = generateStoragePath(game.gameId, versionNumber);

    // Create new GameVersion
    const version = await versionRepo.create({
      gameId: game._id,
      version: versionNumber,
      storagePath,
      entryFile: entryFile || "index.html",
      buildSize: buildSize || undefined,
      status: "draft",
      releaseNote: releaseNote || undefined,
      submittedBy: new ObjectId(user._id.toString()),
    });

    // Update game with new latestVersionId
    await gameRepo.updateLatestVersion(game._id.toString(), version._id);

    // Record history
    await GameHistoryService.recordStatusChange(
      game._id.toString(),
      user,
      undefined,
      "draft",
      { action: "version_created", version: versionNumber }
    );

    // Audit log
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_UPLOAD",
      target: {
        entity: "GAME_VERSION",
        id: version._id.toString(),
      },
      metadata: {
        gameId: game.gameId,
        version: versionNumber,
        storagePath,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        version,
        storagePath,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Upload version error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("already exists")) {
      return new Response(JSON.stringify({ error: "Version already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
