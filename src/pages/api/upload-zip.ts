import type { APIRoute } from "astro";
import JSZip from "jszip";
import {
  uploadBuffer,
  uploadBufferBatch,
  type UploadItem,
} from "../../lib/gcs";
import { validateManifest } from "../../lib/validator";
import { AuditLogger } from "../../lib/audit";
import { GameRepository } from "../../models/Game";
import { GameVersionRepository } from "../../models/GameVersion";
import { GameHistoryService } from "../../lib/game-history";
import { ObjectId } from "mongodb";
import { hasPermissionString } from "../../auth/auth-rbac";

interface ExtractedFile {
  name: string;
  path: string;
  folder: string;
  content: Buffer;
  size: number;
}

/**
 * Find the root folder by locating index.html
 * Returns the folder path that contains index.html, or empty string if at root
 */
function findRootFolder(filePaths: string[]): string {
  // Find index.html in the file list
  const indexFile = filePaths.find((path) => {
    const fileName = path.split("/").pop()?.toLowerCase();
    return fileName === "index.html";
  });

  if (!indexFile) {
    return ""; // No index.html found, assume root
  }

  // Get the folder containing index.html
  const parts = indexFile.split("/");
  if (parts.length === 1) {
    return ""; // index.html is at root
  }

  // Return the folder path (everything except the filename)
  return parts.slice(0, -1).join("/");
}

/**
 * Normalize file path by removing the root folder prefix
 */
function normalizeFilePath(filePath: string, rootFolder: string): string {
  if (!rootFolder) {
    return filePath;
  }

  const prefix = rootFolder + "/";
  if (filePath.startsWith(prefix)) {
    return filePath.substring(prefix.length);
  }

  return filePath;
}

/**
 * Get content type based on file extension
 */
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    mjs: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    webm: "video/webm",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
    txt: "text/plain",
    xml: "application/xml",
    wasm: "application/wasm",
  };

  return contentTypes[ext || ""] || "application/octet-stream";
}

export const POST: APIRoute = async ({ request, locals }) => {
  // Check credentials early
  if (
    !process.env.GCLOUD_PROJECT_ID ||
    (!process.env.GCLOUD_CLIENT_EMAIL &&
      !process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    console.error("[Upload ZIP] Missing GCS credentials");
    return new Response(
      JSON.stringify({
        error:
          "Cấu hình server chưa đúng. Vui lòng kiểm tra environment variables",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check user and permissions
  if (!locals.user || !hasPermissionString(locals.user, "games:create")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const zipFile = formData.get("zipFile") as File;
    const manifestData = formData.get("manifest") as string;

    if (!zipFile) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy file ZIP" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!manifestData) {
      return new Response(
        JSON.stringify({ error: "Thiếu thông tin manifest" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Parse and enhance manifest with server-generated fields
    let manifest;
    try {
      manifest = JSON.parse(manifestData);
    } catch {
      return new Response(
        JSON.stringify({ error: "Manifest JSON không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id, version } = manifest;

    // Generate entryUrl automatically
    const bucketName = process.env.GCLOUD_BUCKET_NAME || "iruka-edu-mini-game";
    manifest.entryUrl = `https://storage.googleapis.com/${bucketName}/games/${id}/${version}/index.html`;

    // Add default iconUrl if not provided
    if (!manifest.iconUrl) {
      manifest.iconUrl = `https://storage.googleapis.com/${bucketName}/games/${id}/icon.png`;
    }

    // Add default minHubVersion if not provided
    if (!manifest.minHubVersion) {
      manifest.minHubVersion = "1.0.0";
    }

    // Add default disabled if not provided
    if (manifest.disabled === undefined) {
      manifest.disabled = false;
    }

    // Now validate the complete manifest
    const enhancedManifestData = JSON.stringify(manifest);
    const validation = validateManifest(enhancedManifestData);
    if (!validation.valid || !validation.manifest) {
      return new Response(
        JSON.stringify({ error: validation.errors.join(", ") }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[Upload ZIP] Processing ${zipFile.name} for game ${id} v${version}`
    );

    // 2. Extract ZIP file
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);

    // Get all file paths (excluding directories)
    const allFilePaths = Object.keys(zipContent.files).filter(
      (fileName) => !zipContent.files[fileName].dir
    );

    console.log(`[Upload ZIP] Found ${allFilePaths.length} files in ZIP`);

    // 3. Find root folder by locating index.html
    const rootFolder = findRootFolder(allFilePaths);

    if (rootFolder) {
      console.log(
        `[Upload ZIP] Detected root folder: "${rootFolder}" (contains index.html)`
      );
    } else {
      console.log(`[Upload ZIP] index.html is at ZIP root`);
    }

    // 4. Extract all files and normalize paths
    const extractedFiles: ExtractedFile[] = [];
    const folderStats: Record<string, { total: number; files: string[] }> = {};

    for (const fileName of allFilePaths) {
      const file = zipContent.files[fileName];

      try {
        const content = await file.async("nodebuffer");

        // Normalize path relative to root folder
        let cleanPath = fileName;

        // Remove leading slash if present
        if (cleanPath.startsWith("/")) {
          cleanPath = cleanPath.substring(1);
        }

        // Normalize based on detected root folder
        cleanPath = normalizeFilePath(cleanPath, rootFolder);

        // Skip if path is empty or outside root folder
        if (!cleanPath || cleanPath.trim() === "") {
          console.log(
            `[Upload ZIP] Skipping: ${fileName} (outside root folder)`
          );
          continue;
        }

        // Determine folder structure for stats
        const folderPath = cleanPath.includes("/")
          ? cleanPath.split("/").slice(0, -1).join("/")
          : "root";
        const baseName = cleanPath.split("/").pop() || cleanPath;

        extractedFiles.push({
          name: baseName,
          path: cleanPath,
          folder: folderPath,
          content,
          size: content.length,
        });

        // Track folder stats
        if (!folderStats[folderPath]) {
          folderStats[folderPath] = { total: 0, files: [] };
        }
        folderStats[folderPath].total++;
        folderStats[folderPath].files.push(baseName);
      } catch (error) {
        console.error(`[Upload ZIP] Failed to extract ${fileName}:`, error);
      }
    }

    console.log(`[Upload ZIP] Extracted ${extractedFiles.length} files`);

    // Log folder structure
    console.log(`[Upload ZIP] Folder structure:`);
    Object.entries(folderStats).forEach(([folder, info]) => {
      console.log(`  ${folder}: ${info.total} files`);
    });

    // 5. Validate required files
    const hasIndex = extractedFiles.some((f) => f.path === "index.html");
    if (!hasIndex) {
      return new Response(
        JSON.stringify({
          error:
            "File ZIP phải chứa index.html. Đảm bảo index.html nằm trong thư mục gốc của game.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Upload manifest first
    const manifestBuffer = Buffer.from(enhancedManifestData, "utf-8");
    await uploadBuffer(
      `games/${id}/${version}/manifest.json`,
      manifestBuffer,
      "application/json"
    );
    console.log(`[Upload ZIP] ✓ Uploaded manifest.json`);

    // 7. Prepare batch upload items
    const uploadItems: UploadItem[] = extractedFiles.map((file) => ({
      destination: `games/${id}/${version}/${file.path}`,
      buffer: file.content,
      contentType: getContentType(file.name),
      isHtml: file.path.endsWith(".html"),
    }));

    // 8. Upload files in parallel (3 concurrent uploads)
    const concurrency = 3;
    console.log(
      `[Upload ZIP] Starting parallel upload (${concurrency} concurrent)`
    );

    const uploadResults = await uploadBufferBatch(
      uploadItems,
      concurrency,
      (completed, total, currentFile) => {
        const fileName = currentFile.split("/").pop();
        console.log(`[Upload ZIP] ✓ ${fileName} (${completed}/${total})`);
      }
    );

    // Check for failures
    const failedUploads = uploadResults.filter((r) => !r.success);
    if (failedUploads.length > 0) {
      console.error(
        `[Upload ZIP] ${failedUploads.length} files failed to upload`
      );
      return new Response(
        JSON.stringify({
          error: `Một số file tải lên thất bại: ${failedUploads
            .map((f) => f.destination.split("/").pop())
            .join(", ")}`,
          details: failedUploads,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 9. Create or update Game and GameVersion records in MongoDB
    // NOTE: Do NOT add to registry index - game must go through QC and approval first
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    let game = await gameRepo.findByGameId(id);

    if (!game && locals.user) {
      // Create new game record
      game = await gameRepo.create({
        gameId: id,
        title: manifest.title || id,
        description: manifest.description || "",
        ownerId: locals.user._id.toString(),
      });

      // Record history
      await GameHistoryService.recordCreation(game._id.toString(), locals.user);
    } else if (game && !game.ownerId && locals.user) {
      // Fix missing ownerId for existing game
      await (gameRepo as any).collection.updateOne(
        { _id: game._id },
        { $set: { ownerId: locals.user._id.toString(), updatedAt: new Date() } }
      );
      game.ownerId = locals.user._id.toString();
      console.log(`[Upload ZIP] Updated missing ownerId for game ${id}`);
    }

    // 10. Create or Update GameVersion record
    let gameVersion = null;
    if (game && locals.user) {
      const totalSize = extractedFiles.reduce((sum, f) => sum + f.size, 0);

      // Check if version already exists
      const existingVersion = await versionRepo.findByVersion(
        game._id.toString(),
        version
      );

      if (existingVersion) {
        // === PATCH MODE ===
        // Only allow patching in draft or qc_failed status
        const ALLOWED_PATCH_STATUSES = ["draft", "qc_failed"];
        if (!ALLOWED_PATCH_STATUSES.includes(existingVersion.status)) {
          return new Response(
            JSON.stringify({
              error: `Phiên bản ${version} đang ở trạng thái "${existingVersion.status}" và không thể ghi đè. Vui lòng nâng version mới.`,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Update existing version (re-upload)
        gameVersion = await versionRepo.patchBuild(
          existingVersion._id.toString(),
          totalSize
        );

        // Record history
        await GameHistoryService.recordStatusChange(
          game._id.toString(),
          locals.user,
          existingVersion.status as any,
          "draft",
          {
            action: "Cập nhật bản build (Patch)",
            note: `Ghi đè bản build v${version}`,
          }
        );

        console.log(
          `[Upload ZIP] Version ${version} patched and reset to draft`
        );
      } else {
        // === NEW VERSION MODE ===
        // Create new version with draft status
        gameVersion = await versionRepo.create({
          gameId: game._id,
          version: version,
          storagePath: `games/${id}/${version}/`,
          entryFile: "index.html",
          buildSize: totalSize,
          status: "draft",
          submittedBy: new ObjectId(locals.user._id.toString()),
          releaseNote: manifest.releaseNote || "",
        });

        // Update game's latestVersionId
        await gameRepo.updateLatestVersion(
          game._id.toString(),
          gameVersion._id
        );

        console.log(
          `[Upload ZIP] Created new version ${version} with status 'draft'`
        );
      }
    }

    // 11. Log audit entry
    if (locals.user) {
      AuditLogger.log({
        actor: {
          user: locals.user,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || undefined,
        },
        action: "GAME_UPLOAD",
        target: {
          entity: "GAME",
          id: id,
          subId: version,
        },
        metadata: {
          method: "ZIP_UPLOAD",
          zipFileName: zipFile.name,
          fileCount: extractedFiles.length,
          rootFolder: rootFolder || "(root)",
          folders: Object.keys(folderStats).length,
          totalSize: extractedFiles.reduce((sum, f) => sum + f.size, 0),
        },
      });
    }

    // 12. Generate summary
    const totalSize = extractedFiles.reduce((sum, f) => sum + f.size, 0);
    const folderSummary = Object.entries(folderStats)
      .map(([folder, info]) => `${folder}: ${info.total} files`)
      .join(", ");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã tải lên thành công ${
          manifest.title || id
        } v${version}! Game đang ở trạng thái Draft, cần hoàn thành Self-QA và submit để QC review.`,
        gameId: id,
        version: version,
        versionId: gameVersion?._id?.toString(),
        status: "draft",
        entryUrl: manifest.entryUrl,
        summary: {
          zipFile: zipFile.name,
          rootFolder: rootFolder || "(root)",
          totalFiles: extractedFiles.length,
          folders: Object.keys(folderStats).length,
          folderBreakdown: folderSummary,
          totalSize: totalSize,
          uploadConcurrency: concurrency,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Upload ZIP] Error:", error);

    let errorMessage = error.message || "Upload ZIP failed";

    if (error.message?.includes("Could not load the default credentials")) {
      errorMessage =
        "Lỗi xác thực Google Cloud. Vui lòng kiểm tra environment variables.";
    } else if (error.message?.includes("403")) {
      errorMessage = "Không có quyền truy cập GCS bucket.";
    } else if (error.message?.includes("corrupted")) {
      errorMessage = "File ZIP bị hỏng hoặc không hợp lệ.";
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
