import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { GameRepository, serializeGame } from "@/models/Game";
import {
  GameVersionRepository,
  serializeGameVersion,
} from "@/models/GameVersion";

/**
 * PUBLIC API: GET /api/public/games/[id]
 * Get published game details by ID or gameId slug
 * No authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    let game;

    // Try to find by MongoDB _id first
    if (ObjectId.isValid(gameId)) {
      game = await gameRepo.findById(gameId);
    }

    // If not found, try to find by gameId slug (e.g., "com.iruka.math")
    if (!game) {
      game = await gameRepo.findByGameId(gameId);
    }

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check if game is available
    if (game.isDeleted || game.disabled || !game.liveVersionId) {
      return NextResponse.json(
        { success: false, error: "Game is not available" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get live version
    const liveVersion = await versionRepo.findById(
      game.liveVersionId.toString()
    );

    if (!liveVersion || liveVersion.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Game version is not available" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const serializedGame = serializeGame(game);
    const serializedVersion = serializeGameVersion(liveVersion);

    return NextResponse.json(
      {
        success: true,
        game: {
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
          releaseNote: liveVersion.releaseNote || "",

          // Publishing info
          publishedAt: game.publishedAt?.toISOString() || null,
          rolloutPercentage: game.rolloutPercentage ?? 100,
        },
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (error) {
    console.error("Get game detail API error:", error);
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
