import type { APIRoute } from "astro";
import { ObjectId } from "mongodb";
import JSZip from "jszip";
import { GameVersionRepository } from "../../../../../models/GameVersion";
import { getUserFromRequest } from "../../../../../lib/session";
import { AuditLogger } from "../../../../../lib/audit";
import { uploadBufferBatch, type UploadItem } from "../../../../../lib/gcs";

/**
 * POST /api/games/versions/[id]/upload-code
 * Upload new code files for an existing version (replaces old files)
 */
export const POST: APIRoute = async ({ params, request }) => {
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
      return new Response(
        JSON.stringify({ error: "Version ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const versionRepo = await GameVersionRepository.getInstance();
    const version = await versionRepo.findById(id);

    if (!version) {
      return new Response(JSON.stringify({ error: "Version not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      return new Response(
        JSON.stringify({ error: "Only ZIP files are allowed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size: 100MB" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find root folder (where index.html is)
    const filePaths = Object.keys(zip.files);
    const indexFile = filePaths.find((path) => {
      const fileName = path.split("/").pop()?.toLowerCase();
      return fileName === "index.html";
    });

    if (!indexFile) {
      return new Response(
        JSON.stringify({ error: "index.html not found in ZIP file" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get root folder
    const parts = indexFile.split("/");
    const rootFolder = parts.length === 1 ? "" : parts.slice(0, -1).join("/");

    // Extract files
    const uploadItems: UploadItem[] = [];
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue; // Skip directories

      // Normalize path (remove root folder prefix)
      let normalizedPath = path;
      if (rootFolder && path.startsWith(rootFolder + "/")) {
        normalizedPath = path.substring(rootFolder.length + 1);
      }

      // Skip if still has folder prefix (not in root)
      if (normalizedPath.includes("../") || normalizedPath.startsWith("/")) {
        continue;
      }

      const content = await zipEntry.async("nodebuffer");
      const gcsPath = `${version.storagePath}${normalizedPath}`;

      uploadItems.push({
        path: gcsPath,
        buffer: content,
        contentType: getContentType(normalizedPath),
      });
    }

    if (uploadItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid files found in ZIP" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Upload to GCS (this will overwrite existing files)
    await uploadBufferBatch(uploadItems);

    // Update version with patchBuild
    const oldStatus = version.status;
    const updatedVersion = await versionRepo.patchBuild(
      id,
      file.size,
      new ObjectId(user._id.toString())
    );

    if (!updatedVersion) {
      return new Response(
        JSON.stringify({ error: "Failed to update version" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log audit entry
    AuditLogger.log({
      actor: {
        user,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
      action: "GAME_VERSION_UPLOAD_CODE",
      target: {
        entity: "GAME_VERSION",
        id: id,
      },
      changes: [
        { field: "buildSize", oldValue: version.buildSize, newValue: file.size },
        {
          field: "status",
          oldValue: oldStatus,
          newValue: updatedVersion.status,
        },
        {
          field: "lastCodeUpdateAt",
          oldValue: version.lastCodeUpdateAt,
          newValue: updatedVersion.lastCodeUpdateAt,
        },
      ],
      metadata: {
        gameId: version.gameId.toString(),
        version: version.version,
        fileCount: uploadItems.length,
        wasPublished: oldStatus === "published",
        statusKept: oldStatus === updatedVersion.status,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        version: updatedVersion,
        filesUploaded: uploadItems.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload code error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    webm: "video/webm",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
  };
  return types[ext || ""] || "application/octet-stream";
}
