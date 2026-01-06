/**
 * Upload System Type Definitions
 * Optimized for "dev speed UX"
 */

// Upload modes
export type UploadMode = 'zip' | 'folder' | 'file';

// UI States: Idle → Uploaded → Validating → Invalid/Ready
export type UploadUIState = 'idle' | 'uploaded' | 'validating' | 'invalid' | 'ready';

// Check status with severity
export type CheckStatus = 'pending' | 'success' | 'warning' | 'error';

// File item
export interface FileItem {
  file: File;
  path: string;
  size: number;
}

// Manifest data
export interface ManifestData {
  id?: string;
  version?: string;
  title?: string;
  runtime?: string;
  [key: string]: unknown;
}

// Live check item
export interface LiveCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  message?: string;
  action?: string; // Suggested action if error/warning
}

// Thumbnail state
export interface ThumbnailState {
  file: File | null;
  previewUrl: string | null;
  isValid: boolean;
  error?: string;
}

// Upload state
export interface UploadState {
  uiState: UploadUIState;
  mode: UploadMode;
  files: FileItem[];
  fileName: string | null;
  fileSize: number;
  manifest: ManifestData | null;
  thumbnailDesktop: ThumbnailState;
  thumbnailMobile: ThumbnailState;
  checks: LiveCheckItem[];
  canSubmit: boolean;
}

// Validation message with action
export interface ValidationMessage {
  type: 'success' | 'warning' | 'error';
  message: string;
  action?: string;
}

// Constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  RECOMMENDED_SIZE: 3 * 1024 * 1024, // 3MB recommended
  MAX_THUMBNAIL_SIZE: 2 * 1024 * 1024, // 2MB
  THUMBNAIL_DESKTOP: { width: 308, height: 211 },
  THUMBNAIL_MOBILE: { width: 343, height: 170 },
  VALID_ID_PREFIX: 'com.iruka.',
  DEFAULT_MANIFEST: {
    id: 'com.iruka.game-name',
    version: '1.0.0',
    title: 'My Game',
    runtime: 'iframe-html'
  }
} as const;

// Tab config
export interface TabConfig {
  id: UploadMode;
  label: string;
}

export const TABS: TabConfig[] = [
  { id: 'zip', label: 'ZIP' },
  { id: 'folder', label: 'Thư mục' },
  { id: 'file', label: 'File lẻ' }
];
