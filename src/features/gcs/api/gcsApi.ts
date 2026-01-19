/**
 * GCS API Functions
 * Calling external API at NEXT_PUBLIC_BASE_API_URL
 */

import {
  externalApiGet,
  externalApiPost,
  externalApiDelete,
  externalApiUpload,
} from "@/lib/external-api";
import type {
  GCSListResponse,
  GCSBucketInfoResponse,
  GCSCleanupRequest,
  GCSCleanupResponse,
  GCSFoldersResponse,
  GCSGameFolder,
  GCSFile,
  GCSStats,
} from "../types";

/**
 * List GCS files
 * GET /api/v1/gcs/files
 */
export async function listGCSFiles(
  prefix?: string,
  limit?: number
): Promise<GCSListResponse> {
  return externalApiGet<GCSListResponse>("/api/v1/gcs/files", {
    prefix: prefix ?? "",
    limit: limit ?? 100,
  });
}

/**
 * Get GCS file (returns URL or redirects)
 * GET /api/v1/gcs/files/{path}
 */
export async function getGCSFile(
  path: string,
  redirect: boolean = true
): Promise<{ url: string } | void> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return externalApiGet(`/api/v1/gcs/files/${encodedPath}`, { redirect });
}

/**
 * Upload file to GCS
 * POST /api/v1/gcs/files?path=...
 */
export async function uploadGCSFile(
  destinationPath: string,
  file: File,
  onUploadProgress?: (progressEvent: any) => void
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  await externalApiUpload(
    `/api/v1/gcs/files?path=${encodeURIComponent(destinationPath)}`,
    formData,
    onUploadProgress
  );
}

/**
 * Delete GCS file
 * DELETE /api/v1/gcs/files?path=...
 */
export async function deleteGCSFile(path: string): Promise<void> {
  await externalApiDelete<void>("/api/v1/gcs/files", { path });
}

/**
 * Get GCS bucket cache/info
 * GET /api/v1/gcs/cache
 */
export async function getGCSCacheInfo(): Promise<GCSBucketInfoResponse> {
  return externalApiGet<GCSBucketInfoResponse>("/api/v1/gcs/cache");
}

/**
 * Cleanup GCS files by prefix
 * POST /api/v1/gcs/cleanup
 */
export async function cleanupGCS(
  request: GCSCleanupRequest
): Promise<GCSCleanupResponse> {
  return externalApiPost<GCSCleanupResponse>("/api/v1/gcs/cleanup", request);
}

/**
 * Transform flat file list to folder structure (for legacy component compatibility)
 */
function transformFilesToFolders(files: GCSListResponse["files"]): {
  folders: GCSGameFolder[];
  stats: GCSStats;
} {
  // Group files by gameId (first path segment after 'games/')
  const folderMap = new Map<string, GCSGameFolder>();

  let totalSize = 0;
  const versionSet = new Map<string, Set<string>>();

  for (const file of files) {
    // Parse path: games/{gameId}/{version}/...
    const parts = file.name.split("/");
    if (parts.length < 3 || parts[0] !== "games") continue;

    const gameId = parts[1];
    const version = parts[2];

    if (!folderMap.has(gameId)) {
      folderMap.set(gameId, {
        gameId,
        gameTitle: undefined,
        inDatabase: false, // Will be updated by component if available
        totalFiles: 0,
        totalSize: 0,
        versions: [],
        lastUpdated: file.updated,
        files: [],
      });
      versionSet.set(gameId, new Set());
    }

    const folder = folderMap.get(gameId)!;
    folder.totalFiles += 1;
    folder.totalSize += file.size;
    totalSize += file.size;

    // Track versions
    if (version && !versionSet.get(gameId)!.has(version)) {
      versionSet.get(gameId)!.add(version);
      folder.versions.push(version);
    }

    // Update last updated if newer
    if (new Date(file.updated) > new Date(folder.lastUpdated)) {
      folder.lastUpdated = file.updated;
    }

    // Add file to folder
    const gcsFile: GCSFile = {
      name: file.name,
      size: file.size,
      content_type: file.content_type,
      updated: file.updated,
      public_url: file.public_url,
      version: version,
      inDatabase: false,
    };
    folder.files.push(gcsFile);
  }

  const folders = Array.from(folderMap.values());
  const stats: GCSStats = {
    totalFolders: folders.length,
    totalFiles: files.length,
    totalSize,
    inDatabase: 0, // Component will update this
    orphaned: folders.length, // Component will update this
  };

  return { folders, stats };
}

/**
 * Get GCS folders with caching - returns legacy format for component compatibility
 */
export async function getGCSFoldersWithCache(): Promise<GCSFoldersResponse> {
  const response = await listGCSFiles("games/", 1000);
  const { folders, stats } = transformFilesToFolders(response.files);

  return {
    success: true,
    folders,
    stats,
  };
}

// Legacy function aliases for backward compatibility

/**
 * Get GCS folders list (legacy - wraps listGCSFiles)
 */
export async function getGCSFolders(): Promise<GCSFoldersResponse> {
  return getGCSFoldersWithCache();
}

/**
 * Get GCS cache (legacy - wraps getGCSCacheInfo)
 */
export async function getGCSCache(): Promise<GCSBucketInfoResponse> {
  return getGCSCacheInfo();
}

/**
 * Clear GCS cache (legacy - no-op for external API)
 */
export async function clearGCSCache(
  _type?: string
): Promise<{ success: boolean; message: string }> {
  // Cache is now handled client-side, this is a no-op
  return { success: true, message: "Cache cleared" };
}

/**
 * Set GCS cache (legacy - no-op for external API)
 */
export async function setGCSCache(
  _data: any,
  _type?: string,
  _ttl?: number
): Promise<{ success: boolean; message: string }> {
  // Cache is now handled client-side, this is a no-op
  return { success: true, message: "Cache set" };
}
