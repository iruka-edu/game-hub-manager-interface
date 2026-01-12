import { NextResponse } from "next/server";
import { GameRepository, serializeGame } from "@/models/Game";
import {
  GameVersionRepository,
  serializeGameVersion,
} from "@/models/GameVersion";

/**
 * PUBLIC API: GET /api/public/games
 * Get all published games (games ready for players to play)
 * No authentication required
 */
export async function GET() {
  try {
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Get all games that have a live version and are not deleted/disabled
    const allGames = await gameRepo.findAll();

    // Filter to only published games
    const publishedGames = await Promise.all(
      allGames
        .filter((game) => {
          // Must have a live version
          if (!game.liveVersionId) return false;
          // Must not be deleted
          if (game.isDeleted) return false;
          // Must not be disabled
          if (game.disabled) return false;
          return true;
        })
        .map(async (game) => {
          // Get live version info
          const liveVersion = game.liveVersionId
            ? await versionRepo.findById(game.liveVersionId.toString())
            : null;

          // Only include if live version exists and is published
          if (!liveVersion || liveVersion.status !== "published") {
            return null;
          }

          const serializedGame = serializeGame(game);
          const serializedVersion = serializeGameVersion(liveVersion);

          return {
            // Game info
            id: serializedGame._id,
            gameId: game.gameId,
            title: game.title,
            description: game.description || "",
            thumbnailDesktop: game.thumbnailDesktop || null,
            thumbnailMobile: game.thumbnailMobile || null,

            // Metadata
            subject: game.subject || null,
            grade: game.grade || null,
            unit: game.unit || null,
            gameType: game.gameType || null,
            lesson: game.lesson || [],
            level: game.level || null,
            skills: game.skills || [],
            themes: game.themes || [],
            tags: game.tags || [],

            // Version info
            version: liveVersion.version,
            versionId: serializedVersion._id,

            // Rollout percentage (for A/B testing)
            rolloutPercentage: game.rolloutPercentage ?? 100,

            // Publishing info
            publishedAt: game.publishedAt?.toISOString() || null,
          };
        })
    );

    // Filter out nulls (games without valid live version)
    const validGames = publishedGames.filter((game) => game !== null);

    return NextResponse.json(
      {
        success: true,
        games: validGames,
        total: validGames.length,
      },
      {
        status: 200,
        headers: {
          // Allow CORS for public API
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          // Cache for 5 minutes
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (error) {
    console.error("Public games API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
