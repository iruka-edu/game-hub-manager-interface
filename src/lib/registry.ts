import { getFileContent, saveFileContent, CDN_BASE } from './gcs';

const REGISTRY_PATH = 'registry/index.json';

export interface GameManifest {
  id: string;
  version: string;
  title?: string;
  runtime?: string;
  capabilities?: string[];
  minHubVersion?: string;
  [key: string]: unknown;
}

// Thông tin chi tiết của mỗi version
export interface VersionInfo {
  version: string;
  uploadedAt: string;
  size?: number;
  changelog?: string;
}

export interface GameEntry {
  id: string;
  title: string;
  activeVersion: string;        // Version đang hoạt động (được Game Hub load)
  versions: VersionInfo[];      // Danh sách tất cả versions đã upload
  entryUrl: string;             // URL đến active version
  manifest: GameManifest;       // Manifest của active version
  updatedAt: string;
  owner?: string;               // Người phụ trách game
  capabilities?: string[];
  minHubVersion?: string;
}

export interface Registry {
  games: GameEntry[];
  generatedAt: string;
}

export const RegistryManager = {
  /**
   * Get the current registry from GCS
   */
  async get(): Promise<Registry> {
    const data = await getFileContent<Registry>(REGISTRY_PATH);
    if (!data) {
      return { games: [], generatedAt: new Date().toISOString() };
    }
    
    // Migration: Convert old format (versions as string[]) to new format (VersionInfo[])
    const migratedGames = data.games.map(game => {
      // Check if versions is already in new format
      if (game.versions.length > 0 && typeof game.versions[0] === 'string') {
        // Old format - migrate
        const oldVersions = game.versions as unknown as string[];
        const newVersions: VersionInfo[] = oldVersions.map(v => ({
          version: v,
          uploadedAt: game.updatedAt || new Date().toISOString()
        }));
        
        return {
          ...game,
          versions: newVersions,
          activeVersion: game.activeVersion || (game as any).latest || oldVersions[oldVersions.length - 1],
          updatedAt: game.updatedAt || (game as any).uploadedAt || new Date().toISOString()
        };
      }
      
      return game;
    });
    
    return { ...data, games: migratedGames };
  },

  /**
   * Add or update a game in the registry (upload new version)
   */
  async updateGame(
    gameId: string,
    version: string,
    manifest: GameManifest,
    fileSize?: number
  ): Promise<Registry> {
    const registry = await this.get();
    const gameIndex = registry.games.findIndex((g) => g.id === gameId);
    const now = new Date().toISOString();

    const newVersionInfo: VersionInfo = {
      version,
      uploadedAt: now,
      size: fileSize
    };

    if (gameIndex === -1) {
      // New game - create entry
      const newGame: GameEntry = {
        id: gameId,
        title: manifest.title || gameId,
        activeVersion: version,  // Auto-activate first version
        versions: [newVersionInfo],
        entryUrl: `${CDN_BASE}/games/${gameId}/${version}/index.html`,
        manifest: manifest,
        updatedAt: now,
        capabilities: manifest.capabilities || [],
        minHubVersion: manifest.minHubVersion,
      };
      registry.games.push(newGame);
    } else {
      // Existing game - add version
      const existingGame = registry.games[gameIndex];
      
      // Check if version already exists
      const existingVersionIndex = existingGame.versions.findIndex(v => v.version === version);
      if (existingVersionIndex !== -1) {
        // Update existing version
        existingGame.versions[existingVersionIndex] = newVersionInfo;
      } else {
        // Add new version
        existingGame.versions.push(newVersionInfo);
      }
      
      // Sort versions by semver (simple string sort for now)
      existingGame.versions.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
      
      // Auto-activate if new version is higher than current active
      const latestVersion = existingGame.versions[existingGame.versions.length - 1].version;
      if (version === latestVersion) {
        existingGame.activeVersion = version;
        existingGame.entryUrl = `${CDN_BASE}/games/${gameId}/${version}/index.html`;
        existingGame.manifest = manifest;
        existingGame.capabilities = manifest.capabilities || [];
        existingGame.minHubVersion = manifest.minHubVersion;
      }
      
      existingGame.updatedAt = now;
      existingGame.title = manifest.title || existingGame.title;
    }

    registry.generatedAt = now;
    await saveFileContent(REGISTRY_PATH, registry);
    return registry;
  },

  /**
   * Set active version for a game (rollback/promote)
   */
  async setActiveVersion(gameId: string, targetVersion: string): Promise<GameEntry | null> {
    const registry = await this.get();
    const gameIndex = registry.games.findIndex((g) => g.id === gameId);

    if (gameIndex === -1) return null;

    const game = registry.games[gameIndex];
    
    // Check if version exists
    const versionExists = game.versions.some(v => v.version === targetVersion);
    if (!versionExists) return null;

    // Update active version
    game.activeVersion = targetVersion;
    game.entryUrl = `${CDN_BASE}/games/${gameId}/${targetVersion}/index.html`;
    game.updatedAt = new Date().toISOString();

    registry.generatedAt = new Date().toISOString();
    await saveFileContent(REGISTRY_PATH, registry);
    
    return game;
  },

  /**
   * Delete a specific version of a game
   * Returns: { success: boolean, error?: string }
   */
  async deleteVersion(gameId: string, version: string): Promise<{ success: boolean; error?: string }> {
    const registry = await this.get();
    const gameIndex = registry.games.findIndex((g) => g.id === gameId);

    if (gameIndex === -1) {
      return { success: false, error: 'Game không tồn tại' };
    }

    const game = registry.games[gameIndex];
    
    // VALIDATION: Cannot delete active version
    if (game.activeVersion === version) {
      return { 
        success: false, 
        error: 'Không thể xóa phiên bản đang hoạt động. Hãy kích hoạt phiên bản khác trước.' 
      };
    }

    // Remove version from list
    game.versions = game.versions.filter((v) => v.version !== version);

    if (game.versions.length === 0) {
      // No versions left, remove game entirely
      registry.games.splice(gameIndex, 1);
    } else {
      game.updatedAt = new Date().toISOString();
    }

    registry.generatedAt = new Date().toISOString();
    await saveFileContent(REGISTRY_PATH, registry);
    return { success: true };
  },

  /**
   * Delete an entire game and all its versions
   */
  async deleteGame(gameId: string): Promise<boolean> {
    const registry = await this.get();
    const gameIndex = registry.games.findIndex((g) => g.id === gameId);

    if (gameIndex === -1) return false;

    registry.games.splice(gameIndex, 1);
    registry.generatedAt = new Date().toISOString();
    await saveFileContent(REGISTRY_PATH, registry);
    return true;
  },
};
