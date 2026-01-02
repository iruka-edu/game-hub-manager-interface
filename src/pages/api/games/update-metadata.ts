import type { APIRoute } from "astro";
import { GameRepository } from "../../../models/Game";
import { GameVersionRepository } from "../../../models/GameVersion";
import { getUserFromRequest } from "../../../lib/session";
import { hasPermissionString } from "../../../auth/auth-rbac";
import { AuditLogger } from "../../../lib/audit";

/**
 * POST /api/games/update-metadata
 * Update game metadata (title, description, subject, grade, etc.)
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

    // Check permission
    if (!hasPermissionString(user, "games:update")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const {
      gameId,
      title,
      description,
      subject,
      grade,
      unit,
      gameType,
      priority,
    } = body;

    if (!gameId) {
      return new Response(JSON.stringify({ error: "gameId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    const game = await gameRepo.findById(gameId);

    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get latest version to check status
    const latestVersion = game.latestVersionId 
      ? await versionRepo.findById(game.latestVersionId.toString())
      : null;

    const currentStatus = latestVersion?.status || 'draft';

    // Check ownership
    const isOwner = game.ownerId === user._id.toString();
    const isAdmin = user.roles.includes("admin");
    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Bạn không có quyền sửa game này" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check status - only allow edit for draft, qc_failed (check latest version status)
    if (!["draft", "qc_failed"].includes(currentStatus)) {
      return new Response(
        JSON.stringify({ 
          error: `Không thể sửa game khi trạng thái là "${currentStatus}". Chỉ có thể sửa khi ở trạng thái "draft" hoặc "qc_failed".` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update metadata
    const updated = await gameRepo.updateMetadata(gameId, {
      title,
      description,
      subject,
      grade,
      unit,
      gameType,
      priority,
    });

    // Audit log
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_UPDATE_METADATA",
      target: {
        entity: "GAME",
        id: game.gameId,
      },
      metadata: { title, subject, grade },
    });

    return new Response(JSON.stringify({ success: true, game: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update metadata error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
