/**
 * Storage path utilities for game version files
 */

/**
 * Generate storage path for a game version
 * Format: "games/{slug}/{version}/"
 * 
 * @param slug - Game slug (e.g., "com.iruka.math-game")
 * @param version - Version string (e.g., "1.0.1")
 * @returns Storage path string
 */
export function generateStoragePath(slug: string, version: string): string {
  if (!slug || slug.trim() === '') {
    throw new Error('slug is required and cannot be empty');
  }
  if (!version || version.trim() === '') {
    throw new Error('version is required and cannot be empty');
  }

  // Sanitize slug and version to prevent path traversal
  const sanitizedSlug = sanitizePathComponent(slug);
  const sanitizedVersion = sanitizePathComponent(version);

  return `games/${sanitizedSlug}/${sanitizedVersion}/`;
}

/**
 * Sanitize a path component to prevent path traversal attacks
 * Removes: .., /, \, and other dangerous characters
 */
function sanitizePathComponent(component: string): string {
  return component
    .replace(/\.\./g, '')  // Remove ..
    .replace(/[\/\\]/g, '') // Remove / and \
    .replace(/[<>:"|?*]/g, '') // Remove other dangerous chars
    .trim();
}

/**
 * Validate storage path format
 * Must match: "games/{slug}/{version}/"
 * 
 * @param path - Storage path to validate
 * @returns true if valid, false otherwise
 */
export function validateStoragePath(path: string): boolean {
  if (!path) {
    return false;
  }

  // Check format: games/{slug}/{version}/
  const pathRegex = /^games\/[^\/]+\/[^\/]+\/$/;
  return pathRegex.test(path);
}

/**
 * Parse storage path into components
 * 
 * @param path - Storage path (e.g., "games/com.iruka.math/1.0.1/")
 * @returns Object with slug and version, or null if invalid
 */
export function parseStoragePath(path: string): { slug: string; version: string } | null {
  if (!validateStoragePath(path)) {
    return null;
  }

  const parts = path.split('/');
  if (parts.length < 4) {
    return null;
  }

  return {
    slug: parts[1],
    version: parts[2]
  };
}

/**
 * Construct full file URL for a game file
 * 
 * @param storagePath - Base storage path (e.g., "games/com.iruka.math/1.0.1/")
 * @param filePath - Relative file path (e.g., "index.html" or "assets/sprite.png")
 * @param baseUrl - Optional base URL (defaults to GCS bucket URL from env)
 * @returns Full file URL
 */
export function constructFileUrl(
  storagePath: string,
  filePath: string,
  baseUrl?: string
): string {
  if (!storagePath || !filePath) {
    throw new Error('storagePath and filePath are required');
  }

  // Use provided baseUrl or get from environment
  const base = baseUrl || process.env.GCS_BASE_URL || 'https://storage.googleapis.com/iruka-games';

  // Ensure storagePath ends with /
  const normalizedPath = storagePath.endsWith('/') ? storagePath : `${storagePath}/`;

  // Remove leading / from filePath if present
  const normalizedFile = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  // Construct full URL
  return `${base}/${normalizedPath}${normalizedFile}`;
}

/**
 * Extract version from storage path
 * 
 * @param path - Storage path
 * @returns Version string or null
 */
export function extractVersionFromPath(path: string): string | null {
  const parsed = parseStoragePath(path);
  return parsed ? parsed.version : null;
}

/**
 * Extract slug from storage path
 * 
 * @param path - Storage path
 * @returns Slug string or null
 */
export function extractSlugFromPath(path: string): string | null {
  const parsed = parseStoragePath(path);
  return parsed ? parsed.slug : null;
}

/**
 * Check if two storage paths conflict (same slug and version)
 * 
 * @param path1 - First storage path
 * @param path2 - Second storage path
 * @returns true if paths conflict, false otherwise
 */
export function pathsConflict(path1: string, path2: string): boolean {
  const parsed1 = parseStoragePath(path1);
  const parsed2 = parseStoragePath(path2);

  if (!parsed1 || !parsed2) {
    return false;
  }

  return parsed1.slug === parsed2.slug && parsed1.version === parsed2.version;
}

/**
 * Generate storage path for game assets
 * 
 * @param slug - Game slug
 * @param version - Version string
 * @param assetPath - Asset relative path (e.g., "assets/images/sprite.png")
 * @returns Full storage path for asset
 */
export function generateAssetPath(slug: string, version: string, assetPath: string): string {
  const basePath = generateStoragePath(slug, version);
  const normalizedAsset = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${basePath}${normalizedAsset}`;
}
