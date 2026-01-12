/**
 * Upload utilities for game file processing
 */

import JSZip from 'jszip';

export interface GameFileValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  files: string[];
  hasIndex: boolean;
  hasManifest: boolean;
  manifestData?: any;
}

export interface UploadProgress {
  stage: 'validating' | 'extracting' | 'uploading' | 'updating' | 'complete';
  progress: number;
  message: string;
  error?: string;
}

/**
 * Validate game ZIP file structure
 */
export async function validateGameZip(file: File): Promise<GameFileValidation> {
  const result: GameFileValidation = {
    valid: false,
    errors: [],
    warnings: [],
    files: [],
    hasIndex: false,
    hasManifest: false,
  };

  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    // Get all files in the ZIP
    const files = Object.keys(zipContent.files);
    result.files = files;

    // Check for required files
    const hasIndex = files.some(f => 
      f.toLowerCase() === 'index.html' || 
      f.toLowerCase().endsWith('/index.html')
    );
    
    const manifestFile = files.find(f => 
      f.toLowerCase() === 'manifest.json' || 
      f.toLowerCase().endsWith('/manifest.json')
    );

    result.hasIndex = hasIndex;
    result.hasManifest = !!manifestFile;

    // Validate required files
    if (!hasIndex) {
      result.errors.push('Thiếu file index.html - đây là điểm vào bắt buộc của game');
    }

    if (!manifestFile) {
      result.errors.push('Thiếu file manifest.json - file này chứa thông tin metadata của game');
    }

    // Validate manifest if exists
    if (manifestFile) {
      try {
        const manifestContent = await zipContent.files[manifestFile].async('string');
        const manifest = JSON.parse(manifestContent);
        result.manifestData = manifest;

        // Basic manifest validation
        if (!manifest.id) {
          result.errors.push('Manifest thiếu trường bắt buộc: id');
        }
        if (!manifest.version) {
          result.errors.push('Manifest thiếu trường bắt buộc: version');
        }
        if (!manifest.title) {
          result.warnings.push('Manifest nên có trường title');
        }
      } catch (error) {
        result.errors.push('Manifest.json không hợp lệ: ' + (error instanceof Error ? error.message : String(error)));
      }
    }

    // Check file size limits
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    for (const fileName of files) {
      const fileObj = zipContent.files[fileName];
      if (!fileObj.dir && (fileObj as any)._data && (fileObj as any)._data.uncompressedSize > maxFileSize) {
        result.warnings.push(`File ${fileName} lớn hơn 10MB`);
      }
    }

    // Check for common issues
    const hasNodeModules = files.some(f => f.includes('node_modules/'));
    if (hasNodeModules) {
      result.warnings.push('ZIP chứa thư mục node_modules - nên loại bỏ để giảm kích thước');
    }

    const hasGitFolder = files.some(f => f.includes('.git/'));
    if (hasGitFolder) {
      result.warnings.push('ZIP chứa thư mục .git - nên loại bỏ để giảm kích thước');
    }

    result.valid = result.errors.length === 0;
    return result;

  } catch (error) {
    result.errors.push('Không thể đọc file ZIP: ' + (error instanceof Error ? error.message : String(error)));
    return result;
  }
}

/**
 * Extract specific files from ZIP
 */
export async function extractFilesFromZip(
  file: File, 
  filePaths: string[]
): Promise<Record<string, string>> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  
  const extracted: Record<string, string> = {};
  
  for (const filePath of filePaths) {
    const fileObj = zipContent.files[filePath];
    if (fileObj && !fileObj.dir) {
      extracted[filePath] = await fileObj.async('string');
    }
  }
  
  return extracted;
}

/**
 * Generate upload progress updates
 */
export function createProgressTracker(
  onProgress: (progress: UploadProgress) => void
) {
  return {
    setStage(stage: UploadProgress['stage'], progress: number, message: string) {
      onProgress({ stage, progress, message });
    },
    
    setError(error: string) {
      onProgress({ 
        stage: 'complete', 
        progress: 0, 
        message: 'Upload failed', 
        error 
      });
    },
    
    setComplete() {
      onProgress({ 
        stage: 'complete', 
        progress: 100, 
        message: 'Upload completed successfully' 
      });
    }
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Validate game ID format
 */
export function validateGameId(gameId: string): { valid: boolean; error?: string } {
  if (!gameId) {
    return { valid: false, error: 'Game ID is required' };
  }
  
  if (gameId.length < 3) {
    return { valid: false, error: 'Game ID must be at least 3 characters' };
  }
  
  if (gameId.length > 50) {
    return { valid: false, error: 'Game ID must be less than 50 characters' };
  }
  
  if (!/^[a-z0-9.-]+$/.test(gameId)) {
    return { 
      valid: false, 
      error: 'Game ID can only contain lowercase letters, numbers, dots, and hyphens' 
    };
  }
  
  if (gameId.startsWith('.') || gameId.endsWith('.')) {
    return { valid: false, error: 'Game ID cannot start or end with a dot' };
  }
  
  if (gameId.startsWith('-') || gameId.endsWith('-')) {
    return { valid: false, error: 'Game ID cannot start or end with a hyphen' };
  }
  
  return { valid: true };
}

/**
 * Validate version format (semantic versioning)
 */
export function validateVersion(version: string): { valid: boolean; error?: string } {
  if (!version) {
    return { valid: false, error: 'Version is required' };
  }
  
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  if (!semverRegex.test(version)) {
    return { 
      valid: false, 
      error: 'Version must follow semantic versioning (e.g., 1.0.0)' 
    };
  }
  
  return { valid: true };
}