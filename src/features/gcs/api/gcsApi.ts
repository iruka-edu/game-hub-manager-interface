import { apiGet, apiPost, apiDelete } from "@/lib/api-fetch";

export interface GCSFile {
  name: string;
  size: number;
  updated: string;
  gameId?: string;
  version?: string;
  inDatabase: boolean;
  gameTitle?: string;
  status?: string;
}

export interface GCSGameFolder {
  gameId: string;
  gameTitle?: string;
  inDatabase: boolean;
  totalFiles: number;
  totalSize: number;
  versions: string[];
  lastUpdated: string;
  files: GCSFile[];
}

export interface GCSStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  inDatabase: number;
  orphaned: number;
}

export interface GCSFoldersResponse {
  success: boolean;
  folders: GCSGameFolder[];
  stats: GCSStats;
}

export interface GCSCacheResponse {
  success: boolean;
  cached: boolean;
  data?: GCSFoldersResponse;
  cachedAt?: string;
  expiresAt?: string;
  message?: string;
}

export interface GCSDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}

/**
 * Get GCS folders list
 * GET /api/gcs/files
 */
export async function getGCSFolders(): Promise<GCSFoldersResponse> {
  return apiGet<GCSFoldersResponse>("/api/gcs/files");
}

/**
 * Delete GCS file or directory
 * DELETE /api/gcs/files/[...path]
 */
export async function deleteGCSFile(filePath: string): Promise<GCSDeleteResponse> {
  // Encode the file path for URL
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  return apiDelete<GCSDeleteResponse>(`/api/gcs/files/${encodedPath}`);
}

/**
 * Get cached GCS data
 * GET /api/gcs/cache?type=folders
 */
export async function getGCSCache(type: string = 'folders'): Promise<GCSCacheResponse> {
  return apiGet<GCSCacheResponse>("/api/gcs/cache", { type });
}

/**
 * Set GCS cache
 * POST /api/gcs/cache
 */
export async function setGCSCache(
  data: any, 
  type: string = 'folders', 
  ttl?: number
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>("/api/gcs/cache", {
    type,
    data,
    ttl,
  });
}

/**
 * Clear GCS cache
 * DELETE /api/gcs/cache?type=folders
 */
export async function clearGCSCache(type?: string): Promise<{ success: boolean; message: string }> {
  const params = type ? { type } : {};
  return apiDelete<{ success: boolean; message: string }>("/api/gcs/cache", params);
}

/**
 * Get GCS folders with caching
 * First try cache, then fetch from API if needed
 */
export async function getGCSFoldersWithCache(): Promise<GCSFoldersResponse> {
  try {
    // Try to get from cache first
    const cacheResponse = await getGCSCache('folders');
    
    if (cacheResponse.success && cacheResponse.cached && cacheResponse.data) {
      console.log('GCS folders loaded from cache');
      return cacheResponse.data;
    }
  } catch (error) {
    console.warn('Failed to get cache, fetching fresh data:', error);
  }

  // Fetch fresh data
  console.log('Fetching fresh GCS folders data');
  const freshData = await getGCSFolders();
  
  // Cache the fresh data (fire and forget)
  try {
    await setGCSCache(freshData, 'folders');
    console.log('GCS folders data cached successfully');
  } catch (error) {
    console.warn('Failed to cache GCS folders data:', error);
  }

  return freshData;
}