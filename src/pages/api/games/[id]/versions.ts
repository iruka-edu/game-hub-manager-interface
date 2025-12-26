import type { APIRoute } from "astro";
import { GameVersionRepository } from "../../../../models/GameVersion";
import { getUserFromRequest } from "../../../../lib/session";

/**
 * GET /api/games/[id]/versions
 * Get all versions for a game
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Game ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const versionRepo = await GameVersionRepository.getInstance();
    const versions = await versionRepo.findByGameId(id);

    // Serialize versions for JSON response
    const serializedVersions = versions.map((v) => ({
      _id: v._id.toString(),
      gameId: v.gameId.toString(),
      version: v.version,
      status: v.status,
      buildSize: v.buildSize,
      releaseNote: v.releaseNote,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    }));

    return new Response(JSON.stringify({ versions: serializedVersions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get versions error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
