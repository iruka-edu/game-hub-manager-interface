import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { uploadGameFiles, deleteFiles, CDN_BASE } from "@/lib/gcs";
import { ObjectId } from "mongodb";

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * POST /api/games/upload
 * Upload game ZIP file to GCS and create/update version
 *
 * FormData:
 * - file: ZIP file
 * - gameId: Game slug (e.g., "com.iruka.math-game")
 * - version: SemVer version (e.g., "1.0.0")
 * - mongoGameId: (optional) MongoDB _id of existing game
 */
export async function POST(request: Request) {
  try {
    // Auth check
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

    // Role check - only dev and admin can upload
    const hasRole = (role: string) =>
      user.roles?.includes(role as any) ?? false;
    if (!hasRole("dev") && !hasRole("admin")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const gameId = formData.get("gameId") as string | null;
    const version = formData.get("version") as string | null;
    const mongoGameId = formData.get("mongoGameId") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }
    if (!version) {
      return NextResponse.json(
        { error: "version is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Only ZIP files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Validate version format (SemVer)
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
    if (!semverRegex.test(version)) {
      return NextResponse.json(
        { error: "Invalid version format. Use SemVer (X.Y.Z)" },
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

    // Check ownership (dev can only upload to own games)
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Storage path: games/{gameId}/{version}/
    const storagePath = `games/${gameId}/${version}`;

    console.log(`[Upload] Uploading ${file.name} to ${storagePath}...`);

    // If updating existing version, clean up old files first (v1 logic: full replace)
    if (existingVersion) {
      console.log(`[Upload] Cleaning up old files at ${storagePath}...`);
      try {
        await deleteFiles(storagePath);
      } catch (e) {
        console.warn("[Upload] Warning: Failed to clean up old files:", e);
        // Continue anyway
      }
    }

    // Upload to GCS
    const uploadResult = await uploadGameFiles(buffer, storagePath, file.name);

    console.log(`[Upload] Upload complete. Entry URL: ${uploadResult.url}`);

    // Create or update version record
    let gameVersion;

    if (existingVersion) {
      // Update existing version (patch build)
      gameVersion = await versionRepo.patchBuild(
        existingVersion._id.toString(),
        file.size,
        new ObjectId(session.userId)
      );
      console.log(`[Upload] Updated existing version ${version}`);
    } else {
      // Create new version
      gameVersion = await versionRepo.create({
        gameId: game._id,
        version,
        storagePath,
        entryFile: "index.html",
        buildSize: file.size,
        status: "draft",
        submittedBy: new ObjectId(session.userId),
      });

      // Update game's latestVersionId
      await gameRepo.updateLatestVersion(game._id.toString(), gameVersion._id);

      console.log(`[Upload] Created new version ${version}`);
    }

    return NextResponse.json({
      success: true,
      message: existingVersion ? "Version updated" : "Version created",
      version: {
        _id: gameVersion?._id.toString(),
        version,
        storagePath,
        entryUrl: uploadResult.url,
        buildSize: file.size,
        filesCount: uploadResult.files.length,
      },
      game: {
        _id: game._id.toString(),
        gameId: game.gameId,
        title: game.title,
      },
      uploadInfo: {
        message: "ZIP được tự động extract từ thư mục chứa index.html",
        extractedFiles: uploadResult.files,
      },
    });
  } catch (error: any) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
