import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { GameRepository } from "@/models/Game";
import { GameVersionRepository } from "@/models/GameVersion";
import { verifySession } from "@/lib/session";
import { UserRepository } from "@/models/User";
import { hasPermissionString } from "@/lib/auth-rbac";
import { AuditLogger } from "@/lib/audit";
import { GameHistoryService } from "@/lib/game-history";
import { generateStoragePath } from "@/lib/storage-path";
import {
  calculateCompleteness,
  DEFAULT_MANDATORY_FIELDS,
} from "@/lib/metadata-types";
import { uploadGameFiles, deleteFiles } from "@/lib/gcs";

/**
 * POST /api/games/upload-with-metadata
 * Upload game with full metadata support (for ResponsiveUploadPage)
 */
export async function POST(request: NextRequest) {
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

    if (!hasPermissionString(user, "games:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const gameData = JSON.parse(formData.get("gameData") as string);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate required fields
    const {
      gameId,
      title,
      description,
      version,
      subject,
      grade,
      gameType,
      lessonNo,
      // Optional fields
      unit,
      textbook,
      theme_primary,
      theme_secondary,
      context_tags,
      difficulty_levels,
      thumbnailDesktop,
      thumbnailMobile,
      priority,
      tags,
      skills,
      themes,
      linkGithub,
    } = gameData;

    // Validation
    if (
      !gameId ||
      !title ||
      !subject ||
      !grade ||
      !gameType ||
      lessonNo === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: gameId, title, subject, grade, gameType, lessonNo",
        },
        { status: 400 }
      );
    }

    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();

    // Check if game exists
    let game = await gameRepo.findByGameId(gameId);
    let isNewGame = false;

    if (!game) {
      // Create new game
      isNewGame = true;

      // Build metadata object
      const metadata = {
        gameType,
        subject,
        grade,
        textbook: textbook || undefined,
        lessonNo: typeof lessonNo === "number" ? lessonNo : parseInt(lessonNo),
        theme_primary: theme_primary || undefined,
        theme_secondary: Array.isArray(theme_secondary)
          ? theme_secondary.filter(Boolean)
          : undefined,
        context_tags: Array.isArray(context_tags)
          ? context_tags.filter(Boolean)
          : undefined,
        difficulty_levels: Array.isArray(difficulty_levels)
          ? difficulty_levels.filter(Boolean)
          : undefined,
        thumbnailUrl: thumbnailDesktop || undefined,
      };

      // Calculate metadata completeness
      const completeness = calculateCompleteness(
        metadata,
        DEFAULT_MANDATORY_FIELDS
      );

      game = await gameRepo.create({
        gameId: gameId.trim(),
        title: title.trim(),
        description,
        ownerId: user._id.toString(),
        subject,
        grade,
        unit,
        gameType,
        priority: priority || "medium",
        tags: Array.isArray(tags) ? tags.filter(Boolean) : undefined,
        skills: Array.isArray(skills) ? skills.filter(Boolean) : undefined,
        themes: Array.isArray(themes) ? themes.filter(Boolean) : undefined,
        linkGithub: linkGithub || undefined,
        thumbnailDesktop: thumbnailDesktop || undefined,
        thumbnailMobile: thumbnailMobile || undefined,
        // Store metadata in the extensible metadata object
        metadata,
        metadataCompleteness: completeness,
        lastMetadataUpdate: new Date(),
        isDeleted: false,
      });
    } else {
      // Check ownership for existing game
      if (
        !hasPermissionString(user, "games:edit_all") &&
        game.ownerId !== session.userId
      ) {
        return NextResponse.json(
          {
            error: "You can only upload to your own games",
          },
          { status: 403 }
        );
      }
    }

    // Upload file to GCS
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = generateStoragePath(gameId, version);

    console.log(`[Upload] Uploading ${file.name} to ${storagePath}...`);

    // Check if version exists
    const existingVersion = await versionRepo.findByVersion(
      game._id.toString(),
      version
    );

    // If updating existing version, clean up old files first
    if (existingVersion) {
      console.log(`[Upload] Cleaning up old files at ${storagePath}...`);
      try {
        await deleteFiles(storagePath);
      } catch (e) {
        console.warn("[Upload] Warning: Failed to clean up old files:", e);
      }
    }

    // Upload to GCS
    const uploadResult = await uploadGameFiles(buffer, storagePath, file.name);
    console.log(`[Upload] Upload complete. Entry URL: ${uploadResult.url}`);

    // Create or update version record
    if (existingVersion) {
      await versionRepo.update(existingVersion._id.toString(), {
        entryUrl: uploadResult.url,
        buildSize: file.size,
        filesCount: uploadResult.files.length,
        submittedBy: new ObjectId(session.userId),
        submittedAt: new Date(),
        status: "draft", // Reset to draft on re-upload
      });
      console.log(`[Upload] Updated existing version ${version}`);
    } else {
      // Create new version
      const gameVersion = await versionRepo.create({
        gameId: game._id,
        version,
        storagePath,
        entryFile: "index.html",
        entryUrl: uploadResult.url,
        buildSize: file.size,
        filesCount: uploadResult.files.length,
        status: "draft",
        submittedBy: new ObjectId(session.userId),
      });

      await gameRepo.updateLatestVersion(game._id.toString(), gameVersion._id);
      console.log(`[Upload] Created new version ${version}`);
    }

    // Log audit event
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_UPLOAD",
      target: {
        entity: "GAME",
        id: game.gameId,
      },
      metadata: {
        method: isNewGame ? "CREATE_NEW" : "UPDATE_EXISTING",
        title: game.title,
        version,
        storagePath,
        entryUrl: uploadResult.url,
        buildSize: file.size,
        filesCount: uploadResult.files.length,
        metadataCompleteness: game.metadataCompleteness,
      },
    });

    // Record game history if new game
    if (isNewGame) {
      await GameHistoryService.recordCreation(game._id.toString(), user);
    }

    return NextResponse.json({
      success: true,
      game,
      version: {
        version,
        storagePath,
        entryUrl: uploadResult.url,
        buildSize: file.size,
        filesCount: uploadResult.files.length,
      },
      uploadInfo: {
        message: "ZIP được tự động extract từ thư mục chứa index.html",
        extractedFiles: uploadResult.files,
      },
    });
  } catch (error: any) {
    console.error("[Upload with Metadata] Error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
