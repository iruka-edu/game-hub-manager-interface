import type { APIRoute } from "astro";
import { GameRepository } from "../../../models/Game";
import { GameVersionRepository } from "../../../models/GameVersion";
import { getUserFromRequest } from "../../../lib/session";
import { AuditLogger } from "../../../lib/audit";
import { NotificationService } from "../../../lib/notification";
import { GameHistoryService } from "../../../lib/game-history";
import { VersionStateMachine } from "../../../lib/version-state-machine";

/**
 * POST /api/games/submit-qc
 * Dev submits game version for QC review
 * Changes version status:
 * - draft/qc_failed -> uploaded (submit)
 * - published/approved -> uploaded (resubmit)
 *
 * Accepts either:
 * - versionId: Submit specific version
 * - gameId: Submit latest version (backward compatible)
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

    // Check role
    const isDev = user.roles.includes("dev");
    const isAdmin = user.roles.includes("admin");
    if (!isDev && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { versionId, gameId } = body;

    if (!versionId && !gameId) {
      return new Response(
        JSON.stringify({ error: "versionId or gameId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    let targetVersionId = versionId;
    let game;

    // If gameId provided, get the latest version
    if (!targetVersionId && gameId) {
      game = await gameRepo.findById(gameId);
      if (!game) {
        return new Response(JSON.stringify({ error: "Game not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Try to get latest version from Game.latestVersionId first
      if (game.latestVersionId) {
        targetVersionId = game.latestVersionId.toString();
      } else {
        // Fallback: Find the most recent version for this game
        const versions = await versionRepo.findByGameId(gameId);
        if (versions.length === 0) {
          // Enhanced error message with debugging info
          return new Response(
            JSON.stringify({
              error:
                "No version found for this game. Please upload a version first.",
              debug: {
                gameId: gameId,
                gameTitle: game.title,
                gameSlug: game.gameId,
                latestVersionId:
                  (game.latestVersionId as any)?.toString() || null,
                suggestion:
                  "Use POST /api/games/" +
                  gameId +
                  "/upload-version to create a version first",
              },
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Get the most recent version (versions are sorted by createdAt desc)
        const latestVersion = versions[0];
        targetVersionId = latestVersion._id.toString();

        // Update game's latestVersionId for future calls
        await gameRepo.updateLatestVersion(gameId, latestVersion._id);
      }
    }

    // Get the version
    const version = await versionRepo.findById(targetVersionId);
    if (!version) {
      return new Response(JSON.stringify({ error: "Version not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get game if not already loaded
    if (!game) {
      game = await gameRepo.findById(version.gameId.toString());
      if (!game) {
        return new Response(JSON.stringify({ error: "Game not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Check ownership (dev can only submit their own games)
    if (!isAdmin && game.ownerId !== user._id.toString()) {
      return new Response(
        JSON.stringify({ error: "You can only submit your own games" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use state machine for transition
    const stateMachine = await VersionStateMachine.getInstance();

    // Determine the appropriate action based on current status
    let action = "submit";
    if (version.status === "published" || version.status === "approved") {
      action = "resubmit";
    }

    // Check if transition is valid
    if (!stateMachine.canTransition(version.status, action)) {
      const validActions = stateMachine.getValidActions(version.status);
      return new Response(
        JSON.stringify({
          error: `Cannot submit version in "${
            version.status
          }" status. Valid actions from this status: ${
            validActions.join(", ") || "none"
          }`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate Self-QA completion
    if (!stateMachine.validateSelfQA(version.selfQAChecklist)) {
      return new Response(
        JSON.stringify({
          error:
            "Please complete all Self-QA checklist items before submitting",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const oldStatus = version.status;

    // Perform transition
    const updatedVersion = await stateMachine.transition(
      targetVersionId,
      action,
      user._id.toString()
    );

    // Set submittedAt timestamp
    await versionRepo.setSubmittedAt(targetVersionId);

    // Record history
    await GameHistoryService.recordSubmission(
      game._id.toString(),
      user,
      oldStatus as any
    );

    // Notify QC users
    await NotificationService.notifyGameSubmitted(
      game.title || game.gameId,
      game._id.toString(),
      user.name || user.email
    );

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: action === "resubmit" ? "GAME_RESUBMIT_QC" : "GAME_SUBMIT_QC",
      target: {
        entity: "GAME_VERSION",
        id: targetVersionId,
      },
      changes: [{ field: "status", oldValue: oldStatus, newValue: "uploaded" }],
      metadata: {
        gameId: game.gameId,
        version: version.version,
        action: action,
      },
    });

    return new Response(
      JSON.stringify({ success: true, version: updatedVersion }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Submit QC error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Validation failed")) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
