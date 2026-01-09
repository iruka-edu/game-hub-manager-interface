/**
 * Upload-related type definitions
 */

import type { LevelCode, SkillGroup, ThemeGroup } from '../lib/hoc-lieu-constants';

/**
 * Extended Game Metadata for upload
 * Includes all fields from học liệu documents
 */
export interface GameMetadata {
  // Basic fields (displayed to user)
  grade: string;           // Lớp / Độ tuổi
  subject: string;         // Môn học
  lesson: string[];        // Bài học
  backendGameId: string;   // Game ID từ backend
  level: LevelCode;        // Level: lam_quen | tien_bo | thu_thach
  skills: string[];        // Mã kỹ năng (M34.COUNT_OBJECTS, etc.)
  themes: string[];        // Mã sở thích (animals_home, etc.)
  linkGithub: string;      // Link GitHub repo/commit
  
  // Additional fields (may not be displayed but required for upload)
  quyenSach?: string;      // Quyển sách / Track
  skillGroup?: SkillGroup; // Nhóm kỹ năng
  themeGroup?: ThemeGroup; // Nhóm sở thích
  
  // Metadata for tracking
  uploadedBy?: string;     // User ID who uploaded
  uploadedAt?: string;     // ISO date string
}

export interface ManifestData {
  gameId: string;
  version: string;
  runtime: string;
  entryPoint: string;
  title?: string;
  description?: string;
}

export interface UploadState {
  file: File | null;
  manifest: ManifestData;
  metadata: GameMetadata;
  isUploading: boolean;
  progress: number;
  stage: UploadStage;
  error: string | null;
}

export type UploadStage = 
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'updating'
  | 'complete'
  | 'error';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  files?: string[];
  manifestData?: any;
}

export interface UploadProgress {
  stage: UploadStage;
  progress: number;
  message: string;
  error?: string;
}

export interface UploadOptions {
  maxFileSize: number;
  allowedExtensions: string[];
  validateManifest: boolean;
  autoExtractManifest: boolean;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'textarea' | 'number';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface UploadConfig {
  endpoints: {
    upload: string;
    update: string;
    validate: string;
  };
  validation: {
    maxFileSize: number;
    allowedTypes: string[];
    requiredFiles: string[];
  };
  ui: {
    showProgress: boolean;
    showValidation: boolean;
    autoRedirect: boolean;
  };
}