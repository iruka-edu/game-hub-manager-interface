/**
 * Public Registry Types
 * 
 * These types define the structure of the Public Registry that is served to Game Hub.
 * The Public Registry contains only published and enabled games with minimal metadata.
 */

/**
 * Entry in the Public Registry - minimal data for Game Hub
 * Contains only the information needed for Game Hub to display and load games
 */
export interface PublicGameEntry {
  /** Game ID (slug), e.g., "com.iruka.math" */
  id: string;
  
  /** Display title of the game */
  title: string;
  
  /** URL to the active version's index.html on GCS */
  entryUrl: string;
  
  /** URL to the game icon (optional) */
  iconUrl?: string;
  
  /** Runtime type, currently only "iframe-html" is supported */
  runtime: string;
  
  /** Required capabilities for the game */
  capabilities: string[];
  
  /** Rollout percentage (0-100), determines what percentage of users can see this game */
  rolloutPercentage: number;
  
  /** Active version string, e.g., "1.2.3" */
  version: string;
  
  /** ISO timestamp of when the entry was last updated */
  updatedAt: string;
  
  /** Minimum Hub version required to run this game (optional) */
  minHubVersion?: string;
}

/**
 * The Public Registry structure stored on GCS at registry/public.json
 */
export interface PublicRegistry {
  /** Array of published and enabled game entries */
  games: PublicGameEntry[];
  
  /** ISO timestamp of when the registry was generated */
  generatedAt: string;
  
  /** Registry schema version for future compatibility */
  version: string;
}

/**
 * Current schema version for the Public Registry
 */
export const PUBLIC_REGISTRY_VERSION = '1.0.0';

/**
 * Path to the Public Registry file on GCS
 */
export const PUBLIC_REGISTRY_PATH = 'registry/public.json';

/**
 * Validate that an object is a valid PublicGameEntry
 */
export function isValidPublicGameEntry(entry: unknown): entry is PublicGameEntry {
  if (!entry || typeof entry !== 'object') {
    return false;
  }
  
  const e = entry as Record<string, unknown>;
  
  return (
    typeof e.id === 'string' && e.id.length > 0 &&
    typeof e.title === 'string' &&
    typeof e.entryUrl === 'string' && e.entryUrl.length > 0 &&
    typeof e.runtime === 'string' &&
    Array.isArray(e.capabilities) &&
    typeof e.rolloutPercentage === 'number' &&
    e.rolloutPercentage >= 0 && e.rolloutPercentage <= 100 &&
    typeof e.version === 'string' &&
    typeof e.updatedAt === 'string'
  );
}

/**
 * Validate that an object is a valid PublicRegistry
 */
export function isValidPublicRegistry(registry: unknown): registry is PublicRegistry {
  if (!registry || typeof registry !== 'object') {
    return false;
  }
  
  const r = registry as Record<string, unknown>;
  
  if (!Array.isArray(r.games)) {
    return false;
  }
  
  if (typeof r.generatedAt !== 'string' || typeof r.version !== 'string') {
    return false;
  }
  
  // Validate all game entries
  return r.games.every(isValidPublicGameEntry);
}

/**
 * Create an empty PublicRegistry
 */
export function createEmptyPublicRegistry(): PublicRegistry {
  return {
    games: [],
    generatedAt: new Date().toISOString(),
    version: PUBLIC_REGISTRY_VERSION
  };
}
