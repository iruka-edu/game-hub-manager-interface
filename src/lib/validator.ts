import type { GameManifest } from './registry';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
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
    errors.push("Missing 'index.html'. This is the required entry point.");
  }
  if (!hasManifest) {
    errors.push("Missing 'manifest.json'. This file contains game metadata.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Parse and validate manifest content
 */
export const validateManifest = (content: string): ValidationResult => {
  const errors: string[] = [];

  try {
    const manifest = JSON.parse(content) as GameManifest;

    if (!manifest.id) {
      errors.push("Manifest missing required field: 'id'");
    }
    if (!manifest.version) {
      errors.push("Manifest missing required field: 'version'");
    }

    // Validate id format (alphanumeric with hyphens)
    if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
      errors.push("Game 'id' must be lowercase alphanumeric with hyphens only");
    }

    // Validate version format (semver-like)
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push("Version should follow semantic versioning (e.g., 1.0.0)");
    }

    return {
      valid: errors.length === 0,
      errors,
      manifest: errors.length === 0 ? manifest : undefined,
    };
  } catch (e) {
    return {
      valid: false,
      errors: ['Invalid JSON in manifest.json'],
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
