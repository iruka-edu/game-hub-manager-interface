import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";

/**
 * PUBLIC API: GET /api/public/games/[id]/play
 * Get the GCS URL (entry point) for playing a specific game
 * No authentication required
 *
 * Response includes the full URL to the game's index.html
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    // Validate game ID format (can be MongoDB _id or gameId slug)
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

    // Check if game is available for play
    if (game.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Game has been removed" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (game.disabled) {
      return NextResponse.json(
        { success: false, error: "Game is currently unavailable" },
        {
          status: 403,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check if game has a live version
    if (!game.liveVersionId) {
      return NextResponse.json(
        { success: false, error: "Game is not yet published" },
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

    // Build the GCS URL
    // Format: https://storage.googleapis.com/{bucket}/{storagePath}/{entryFile}
    const gcsBucket = process.env.GCLOUD_BUCKET_NAME || "iruka-edu-mini-game";
    const gcsBaseUrl =
      process.env.GCS_BASE_URL || `https://storage.googleapis.com/${gcsBucket}`;

    // Storage path format: "games/{slug}/{version}/"
    const storagePath = liveVersion.storagePath.replace(/\/$/, ""); // Remove trailing slash
    const entryFile = liveVersion.entryFile || "index.html";

    const gameUrl = `${gcsBaseUrl}/${storagePath}/${entryFile}`;

    return NextResponse.json(
      {
        success: true,
        game: {
          id: game._id.toString(),
          gameId: game.gameId,
          title: game.title,
          description: game.description || "",
          thumbnailDesktop: game.thumbnailDesktop || null,
          thumbnailMobile: game.thumbnailMobile || null,
        },
        version: {
          id: liveVersion._id.toString(),
          version: liveVersion.version,
          releaseNote: liveVersion.releaseNote || "",
        },
        // The main URL to load the game
        gameUrl,
        // Alternative: base path (if game needs to load assets relative to index.html)
        basePath: `${gcsBaseUrl}/${storagePath}`,
        // Entry file name
        entryFile,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          // Cache for 1 minute (games can be updated)
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch (error) {
    console.error("Play game API error:", error);
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
