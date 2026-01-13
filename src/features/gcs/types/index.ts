/**
 * GCS Management Types
 */

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

export type GCSFolderFilter = 'all' | 'orphaned' | 'in-database';

export type GCSSortField = 'gameId' | 'totalSize' | 'lastUpdated' | 'gameTitle' | 'totalFiles';
export type GCSSortOrder = 'asc' | 'desc';