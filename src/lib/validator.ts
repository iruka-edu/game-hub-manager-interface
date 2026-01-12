import type { GameManifest } from '@iruka-edu/game-core';
import { validateManifest as validateManifestCore } from '@iruka-edu/game-core';
import { enhancedValidator } from './enhanced-validator';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  suggestions?: string[];
  manifest?: GameManifest;
}

/**
 * Validate game files on client-side (browser)
 * Checks for required files: index.html, manifest.json
 */
export const validateGameFiles = (files: File[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for index.html
  const hasIndex = files.some(
    (f) => f.name === 'index.html' || f.webkitRelativePath?.endsWith('/index.html')
  );

  // Check for manifest.json
  const hasManifest = files.some(
    (f) => f.name === 'manifest.json' || f.webkitRelativePath?.endsWith('/manifest.json')
  );

  if (!hasIndex) {
    errors.push("Thiếu file 'index.html' - đây là điểm vào bắt buộc của game");
  }
  if (!hasManifest) {
    errors.push("Thiếu file 'manifest.json' - file này chứa thông tin metadata của game");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Enhanced manifest validation with detailed rules and suggestions
 */
export const validateManifest = (content: string): ValidationResult => {
  const result = enhancedValidator.validateManifest(content);
  
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    suggestions: result.suggestions,
    manifest: result.manifest as GameManifest,
  };
};

/**
 * Core manifest validation using @iruka-edu/game-core library
 */
export const validateManifestWithCore = (content: string): ValidationResult => {
  try {
    const manifest = JSON.parse(content) as GameManifest;
    const coreResult = validateManifestCore(manifest);
    
    return {
      valid: coreResult.ok,
      errors: coreResult.errors.map(issue => issue.message),
      warnings: coreResult.warnings.map(issue => issue.message),
      manifest: coreResult.ok ? manifest : undefined,
    };
  } catch (e) {
    return {
      valid: false,
      errors: ['JSON không hợp lệ trong manifest.json'],
    };
  }
};

/**
 * Legacy validation for backward compatibility
 * @deprecated Use validateManifest instead
 */
export const validateManifestLegacy = (content: string): ValidationResult => {
  const errors: string[] = [];

  try {
    const manifest = JSON.parse(content) as GameManifest;

    if (!manifest.id) {
      errors.push("Manifest thiếu trường bắt buộc: 'id'");
    }
    if (!manifest.version) {
      errors.push("Manifest thiếu trường bắt buộc: 'version'");
    }

    // Basic id format validation
    if (manifest.id && !/^[a-z0-9.-]+$/.test(manifest.id)) {
      errors.push("Game 'id' phải là chữ thường, số, dấu gạch ngang (-) hoặc dấu chấm (.)");
    }

    // Basic version format validation
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push("Version phải theo chuẩn semantic versioning (ví dụ: 1.0.0)");
    }

    return {
      valid: errors.length === 0,
      errors,
      manifest: errors.length === 0 ? manifest : undefined,
    };
  } catch (e) {
    return {
      valid: false,
      errors: ['JSON không hợp lệ trong manifest.json'],
    };
  }
};

/**
 * Find manifest file from file list
 */
export const findManifestFile = (files: File[]): File | undefined => {
  return files.find(
    (f) => f.name === 'manifest.json' || f.webkitRelativePath?.endsWith('/manifest.json')
  );
};
