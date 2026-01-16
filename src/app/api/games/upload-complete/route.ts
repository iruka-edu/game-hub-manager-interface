import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { extractZipFromGCS, deleteFiles, CDN_BASE } from "@/lib/gcs";
import { ObjectId } from "mongodb";

/**
 * POST /api/games/upload-complete
 * Finalize upload after client uploads ZIP directly to GCS
 * Extract ZIP and create/update version record
 */
export async function POST(request: Request) {
  try {
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

    const hasRole = (role: string) => user.roles?.includes(role as any) ?? false;
    if (!hasRole("dev") && !hasRole("admin")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { gameId, version, mongoGameId, storagePath, fileName, fileSize } =
      await request.json();

    if (!gameId || !version || !storagePath || !fileName || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get game from database
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    let game = mongoGameId
      ? await gameRepo.findById(mongoGameId)
      : await gameRepo.findByGameId(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check ownership
    if (!hasRole("admin") && game.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "You can only upload to your own games" },
        { status: 403 }
      );
    }

    // Check if version already exists
    const existingVersion = await versionRepo.findByVersion(
      game._id.toString(),
      version
    );

    console.log(`[Upload Complete] Extracting ZIP from ${storagePath}/${fileName}...`);

    // Extract ZIP from GCS
    let extractResult;
    try {
      extractResult = await extractZipFromGCS(storagePath, fileName);
      console.log(`[Upload Complete] Extracted ${extractResult.files.length} files`);
    } catch (extractError: any) {
      console.error(`[Upload Complete] ZIP extraction failed:`, extractError);
      
      // Rollback: Delete game if it was just created (no existing version)
      if (!existingVersion) {
        console.log(`[Upload Complete] Rolling back - deleting game ${game._id}`);
        try {
          await gameRepo.delete(game._id.toString());
          console.log(`[Upload Complete] Rollback successful - game deleted`);
        } catch (rollbackError) {
          console.error(`[Upload Complete] Rollback failed:`, rollbackError);
        }
      }
      
      throw new Error(`Extract ZIP thất bại: ${extractError.message}`);
    }

    // Create or update version record
    let gameVersion;

    if (existingVersion) {
      // Update existing version
      gameVersion = await versionRepo.patchBuild(
        existingVersion._id.toString(),
        fileSize,
        new ObjectId(session.userId)
      );
      console.log(`[Upload Complete] Updated existing version ${version}`);
    } else {
      // Create new version
      gameVersion = await versionRepo.create({
        gameId: game._id,
        version,
        storagePath,
        entryFile: "index.html",
        buildSize: fileSize,
        status: "draft",
        submittedBy: new ObjectId(session.userId),
      });

      // Update game's latestVersionId
      await gameRepo.updateLatestVersion(game._id.toString(), gameVersion._id);

      console.log(`[Upload Complete] Created new version ${version}`);
    }

    return NextResponse.json({
      success: true,
      message: existingVersion ? "Version updated" : "Version created",
      version: {
        _id: gameVersion?._id.toString(),
        version,
        storagePath,
        entryUrl: extractResult.url,
        buildSize: fileSize,
        filesCount: extractResult.files.length,
      },
      game: {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
      },
      uploadInfo: {
        message: "ZIP được tự động extract từ thư mục chứa index.html",
        extractedFiles: extractResult.files,
      },
    });
  } catch (error: any) {
    console.error("[Upload Complete] Error:", error);
    return NextResponse.json(
      { error: error.message || "Upload finalization failed" },
      { status: 500 }
    );
  }
}
