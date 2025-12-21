import type { APIRoute } from "astro";
import { GameRepository } from "../../../../models/Game";
import { getUserFromRequest } from "../../../../lib/session";
import {
  canAdminHardDelete,
  isSafeForHardDelete,
} from "../../../../auth/deletion-rules";
import { AuditLogger } from "../../../../lib/audit";

/**
 * POST /api/games/[id]/hard-delete-request
 * Admin requests hard deletion of a game
 *
 * This doesn't immediately delete the game, but marks it for hard deletion
 * by a background job that will verify safety conditions.
 *
 * Rules:
 * - Requires games:delete_hard permission (Super-admin only)
 * - Game must be soft-deleted first
 * - Must pass safety checks (no learner sessions, no lesson mapping)
 * - Creates a deletion request for background processing
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

    const gameId = params.id;
    if (!gameId) {
      return new Response(JSON.stringify({ error: "Game ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const gameRepo = await GameRepository.getInstance();

    // Find the game (including deleted ones)
    const game = await gameRepo.findByIdIncludeDeleted(gameId);
    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions using ABAC rules
    if (!canAdminHardDelete(user, game)) {
      return new Response(
        JSON.stringify({
          error:
            "Forbidden. Game must be soft-deleted first and you need super-admin permissions.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check safety conditions
    if (!isSafeForHardDelete(game)) {
      return new Response(
        JSON.stringify({
          error:
            "Game is not safe for hard deletion. It may have learner sessions, lesson mappings, or insufficient retention period.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get deletion reason from request
    const body = await request.json();
    const { reason, force = false } = body;

    if (!reason) {
      return new Response(
        JSON.stringify({ error: "Deletion reason is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For now, we'll add a flag to mark for hard deletion
    // In a real system, you'd create a separate collection for deletion requests
    const now = new Date();

    const updatedGame = await gameRepo.update(gameId, {
      deleteReason: `hard_delete_requested: ${reason}` as any,
      updatedAt: now,
    });

    if (!updatedGame) {
      return new Response(
        JSON.stringify({ error: "Failed to create deletion request" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_HARD_DELETE_REQUEST",
      target: {
        entity: "GAME",
        id: gameId,
      },
      changes: [
        {
          field: "deleteReason",
          oldValue: game.deleteReason,
          newValue: `hard_delete_requested: ${reason}`,
        },
      ],
      metadata: {
        gameTitle: game.title,
        gameSlug: game.gameId,
        requestReason: reason,
        force: force,
        gcsPath: game.gcsPath,
        safetyChecked: true,
        scheduledForDeletion: true,
      },
    });

    return new Response(
      JSON.stringify({
        message: "Hard deletion request created successfully",
        gameId: gameId,
        requestedAt: now.toISOString(),
        reason: reason,
        note: "Game will be permanently deleted by background job after final safety verification",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hard delete request error:", error);
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
