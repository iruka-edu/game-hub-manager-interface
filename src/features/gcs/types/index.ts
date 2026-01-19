/**
 * GCS Management Types
 * Matching BE_vu_v2.json API schemas
 */

/**
 * GCS File Info
 * Matches GCSFileInfo schema
 */
export interface GCSFileInfo {
  name: string;
  size: number;
  content_type: string;
  updated: string;
  public_url: string;
}

/**
 * GCS List Response
 * Matches GCSListResponse schema
 */
export interface GCSListResponse {
  files: GCSFileInfo[];
  prefix: string;
  total: number;
  bucket: string;
}

/**
 * GCS Bucket Info Response
 * Matches GCSBucketInfoResponse schema
 */
export interface GCSBucketInfoResponse {
  bucket_name: string;
  public_base: string;
  status: string;
}

/**
 * GCS Cleanup Request
 * Matches GCSCleanupRequest schema
 */
export interface GCSCleanupRequest {
  prefix: string;
  confirm?: boolean;
}

/**
 * GCS Cleanup Response
 * Matches GCSCleanupResponse schema
 */
export interface GCSCleanupResponse {
  success: boolean;
  deleted_count: number;
  prefix: string;
  message: string;
}

// Legacy aliases for backward compatibility
export interface GCSFile extends GCSFileInfo {
  gameId?: string;
  version?: string;
  inDatabase?: boolean;
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

export interface GCSFilesResponse {
  success: boolean;
  files: GCSFile[];
  stats: GCSStats;
}

export interface GCSDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}

export interface GCSCacheResponse {
  success: boolean;
  cached: boolean;
  data?: GCSFoldersResponse;
  cachedAt?: string;
  expiresAt?: string;
  message?: string;
}

export type GCSFolderFilter = "all" | "orphaned" | "in-database";
export type GCSSortField =
  | "gameId"
  | "totalSize"
  | "lastUpdated"
  | "gameTitle"
  | "totalFiles";
export type GCSSortOrder = "asc" | "desc";
