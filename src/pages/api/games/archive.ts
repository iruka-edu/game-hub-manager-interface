import type { APIRoute } from "astro";
import { GameRepository } from "../../../models/Game";
import { GameVersionRepository } from "../../../models/GameVersion";
import { getUserFromRequest } from "../../../lib/session";
import { canArchiveGame } from "../../../auth/deletion-rules";
import { AuditLogger } from "../../../lib/audit";
import { PublicRegistryManager } from "../../../lib/public-registry";
import { VersionStateMachine } from "../../../lib/version-state-machine";

/**
 * POST /api/games/archive
 * CTO/Admin archives a game to remove it from production
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

    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return new Response(JSON.stringify({ error: "gameId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Find the game
    const game = await gameRepo.findById(gameId);
    if (!game || game.isDeleted) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions using ABAC rules
    if (!canArchiveGame(user, game)) {
      return new Response(
        JSON.stringify({
          error: "Forbidden. You do not have permission to archive games.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the live version if it exists
    let liveVersion = null;
    if (game.liveVersionId) {
      liveVersion = await versionRepo.findById(game.liveVersionId.toString());
    }

    // Archive the live version using state machine
    if (liveVersion && liveVersion.status === "published") {
      const stateMachine = await VersionStateMachine.getInstance();

      try {
        await stateMachine.transition(
          liveVersion._id.toString(),
          "archive",
          user._id.toString()
        );
      } catch (error) {
        console.error("Failed to archive version:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to archive game version",
            details: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Remove from Public Registry
    try {
      await PublicRegistryManager.removeGame(game.gameId);
    } catch (error) {
      console.error("Failed to remove from registry:", error);
      // Continue - this is not critical for the archive operation
    }

    // Update game metadata
    const now = new Date();
    const updatedGame = await gameRepo.update(gameId, {
      disabled: true,
      updatedAt: now,
    });

    if (!updatedGame) {
      return new Response(JSON.stringify({ error: "Failed to update game" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_ARCHIVE",
      target: {
        entity: "GAME",
        id: gameId,
      },
      changes: [
        { field: "disabled", oldValue: game.disabled, newValue: true },
        {
          field: "liveVersionStatus",
          oldValue: liveVersion?.status || null,
          newValue: "archived",
        },
      ],
      metadata: {
        gameTitle: game.title,
        gameSlug: game.gameId,
        liveVersionId: game.liveVersionId?.toString() || null,
        removedFromRegistry: true,
        preserveData: true,
      },
    });

    return new Response(
      JSON.stringify({
        message: "Game archived successfully",
        gameId: gameId,
        archivedAt: now.toISOString(),
        removedFromRegistry: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Archive game error:", error);
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
