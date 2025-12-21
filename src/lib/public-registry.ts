/**
 * Public Registry Manager
 * 
 * Service for managing the Public Registry on GCS.
 * The Public Registry contains only published and enabled games for Game Hub consumption.
 */

import { getFileContent, saveFileContent, CDN_BASE } from './gcs';
import { GameRepository } from '../models/Game';
import { GameVersionRepository } from '../models/GameVersion';
import type { Game } from '../models/Game';
import type { GameVersion } from '../models/GameVersion';
import {
  type PublicGameEntry,
  type PublicRegistry,
  PUBLIC_REGISTRY_VERSION,
  PUBLIC_REGISTRY_PATH,
  createEmptyPublicRegistry,
  isValidPublicRegistry
} from './public-registry-types';

/**
 * PublicRegistryManager service
 * Manages synchronization between MongoDB and the Public Registry on GCS
 */
export const PublicRegistryManager = {
  /**
   * Get the current Public Registry from GCS
   * @returns The Public Registry or an empty registry if not found/invalid
   */
  async get(): Promise<PublicRegistry> {
    try {
      const data = await getFileContent<PublicRegistry>(PUBLIC_REGISTRY_PATH);
      
      if (!data) {
        return createEmptyPublicRegistry();
      }
      
      // Validate the registry structure
      if (!isValidPublicRegistry(data)) {
        console.warn('[PublicRegistry] Invalid registry structure, returning empty registry');
        return createEmptyPublicRegistry();
      }
      
      return data;
    } catch (error) {
      console.error('[PublicRegistry] Error reading registry:', error);
      return createEmptyPublicRegistry();
    }
  },

  /**
   * Generate and upload the Public Registry from MongoDB
   * Only includes games that are published and not disabled
   * 
   * Filtering logic:
   * 1. Query MongoDB for games with liveVersionId set and disabled !== true
   * 2. For each game, verify the live version has status 'published'
   * 3. Extract only necessary metadata for PublicGameEntry
   * 
   * @returns The generated Public Registry
   */
  async sync(): Promise<PublicRegistry> {
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    
    // Step 1: Get all games that are not disabled and have a live version
    // This filters at the database level for efficiency
    const games = await gameRepo.findPublishedAndEnabled();
    
    console.log(`[PublicRegistry] Found ${games.length} candidate games (not disabled, has liveVersionId)`);
    
    // Step 2: Build public entries, filtering for published versions
    const entries: PublicGameEntry[] = [];
    
    for (const game of games) {
      // buildPublicEntry will verify the live version is 'published'
      // and extract only necessary metadata
      const entry = await this.buildPublicEntry(game, versionRepo);
      if (entry) {
        entries.push(entry);
      }
    }
    
    console.log(`[PublicRegistry] Built ${entries.length} public entries (with published versions)`);
    
    // Step 3: Create the registry
    const registry: PublicRegistry = {
      games: entries,
      generatedAt: new Date().toISOString(),
      version: PUBLIC_REGISTRY_VERSION
    };
    
    // Save to GCS with no-cache header
    await saveFileContent(PUBLIC_REGISTRY_PATH, registry);
    
    console.log(`[PublicRegistry] Synced ${entries.length} games to public registry at ${PUBLIC_REGISTRY_PATH}`);
    
    return registry;
  },

  /**
   * Build a PublicGameEntry from a Game and its live version
   * 
   * This method extracts only necessary metadata for the Public Registry:
   * - id, title, entryUrl, iconUrl, capabilities, runtime, rolloutPercentage, version, updatedAt
   * 
   * Filtering logic:
   * - Game must have a liveVersionId
   * - Live version must exist and have status 'published'
   * 
   * @param game - The game document
   * @param versionRepo - Version repository instance
   * @returns PublicGameEntry or null if version not found or not published
   */
  async buildPublicEntry(
    game: Game,
    versionRepo: GameVersionRepository
  ): Promise<PublicGameEntry | null> {
    // Check if game has a live version set
    if (!game.liveVersionId) {
      console.warn(`[PublicRegistry] Game ${game.gameId} has no liveVersionId, skipping`);
      return null;
    }
    
    // Get the live version
    const version = await versionRepo.findById(game.liveVersionId.toString());
    if (!version) {
      console.warn(`[PublicRegistry] Live version not found for game ${game.gameId}, skipping`);
      return null;
    }
    
    // Only include published versions - this is the key filtering step
    if (version.status !== 'published') {
      console.warn(`[PublicRegistry] Live version ${version.version} for game ${game.gameId} is not published (status: ${version.status}), skipping`);
      return null;
    }
    
    // Extract only necessary metadata for Public Registry
    const entry: PublicGameEntry = {
      id: game.gameId,
      title: game.title,
      entryUrl: `${CDN_BASE}/${version.storagePath}${version.entryFile}`,
      runtime: 'iframe-html',
      capabilities: game.tags || [],
      rolloutPercentage: game.rolloutPercentage ?? 100,
      version: version.version,
      updatedAt: game.updatedAt.toISOString()
    };
    
    // Add iconUrl if available (optional field)
    // Note: Icon URL logic can be added here when icon storage is implemented
    
    console.log(`[PublicRegistry] Built entry for game ${game.gameId} v${version.version}`);
    return entry;
  },

  /**
   * Add or update a single game entry in the Public Registry
   * @param entry - The PublicGameEntry to upsert
   */
  async upsertGame(entry: PublicGameEntry): Promise<void> {
    const registry = await this.get();
    
    // Find existing entry
    const existingIndex = registry.games.findIndex(g => g.id === entry.id);
    
    if (existingIndex !== -1) {
      // Update existing
      registry.games[existingIndex] = entry;
    } else {
      // Add new
      registry.games.push(entry);
    }
    
    registry.generatedAt = new Date().toISOString();
    
    await saveFileContent(PUBLIC_REGISTRY_PATH, registry);
  },

  /**
   * Remove a game from the Public Registry
   * @param gameId - The game ID to remove
   */
  async removeGame(gameId: string): Promise<void> {
    const registry = await this.get();
    
    const initialLength = registry.games.length;
    registry.games = registry.games.filter(g => g.id !== gameId);
    
    if (registry.games.length < initialLength) {
      registry.generatedAt = new Date().toISOString();
      await saveFileContent(PUBLIC_REGISTRY_PATH, registry);
      console.log(`[PublicRegistry] Removed game ${gameId} from public registry`);
    }
  },

  /**
   * Update rollout percentage for a game
   * @param gameId - The game ID
   * @param percentage - New rollout percentage (0-100)
   */
  async updateRollout(gameId: string, percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }
    
    const registry = await this.get();
    
    const game = registry.games.find(g => g.id === gameId);
    if (game) {
      game.rolloutPercentage = percentage;
      game.updatedAt = new Date().toISOString();
      registry.generatedAt = new Date().toISOString();
      await saveFileContent(PUBLIC_REGISTRY_PATH, registry);
    }
  },

  /**
   * Get public registry filtered for a specific user based on rollout percentage
   * Uses a deterministic hash of userId to ensure consistent rollout
   * @param userId - The user ID to filter for
   * @returns Array of games the user can see
   */
  getForUser(registry: PublicRegistry, userId: string): PublicGameEntry[] {
    // Simple hash function for deterministic rollout
    const hash = this.hashUserId(userId);
    const userPercentile = hash % 100;
    
    return registry.games.filter(game => {
      // User sees the game if their percentile is less than rollout percentage
      return userPercentile < game.rolloutPercentage;
    });
  },

  /**
   * Simple hash function for user ID
   * Returns a number between 0 and 99
   */
  hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }
};
