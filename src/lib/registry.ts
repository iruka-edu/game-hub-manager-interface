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

export interface GameEntry {
  id: string;
  title: string;
  version: string;
  latest: string;
  versions: string[];
  entryUrl: string;
  manifest: GameManifest;
  uploadedAt: string;
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
    return data || { games: [], generatedAt: new Date().toISOString() };
  },

  /**
   * Add or update a game in the registry
   */
  async updateGame(
    gameId: string,
    version: string,
    manifest: GameManifest
  ): Promise<Registry> {
    const registry = await this.get();
    const gameIndex = registry.games.findIndex((g) => g.id === gameId);

    const newGameData: GameEntry = {
      id: gameId,
      title: manifest.title || gameId,
      version: version,
      latest: version,
      versions: [],
      entryUrl: `${CDN_BASE}/games/${gameId}/${version}/index.html`,
      manifest: manifest,
      uploadedAt: new Date().toISOString(),
      capabilities: manifest.capabilities || [],
      minHubVersion: manifest.minHubVersion,
    };

    if (gameIndex === -1) {
      // New game
      newGameData.versions = [version];
      registry.games.push(newGameData);
    } else {
      // Update existing game
      const existingGame = registry.games[gameIndex];
      const versionSet = new Set([...existingGame.versions, version]);
      newGameData.versions = Array.from(versionSet).sort();
      newGameData.latest = newGameData.versions[newGameData.versions.length - 1];
      registry.games[gameIndex] = { ...existingGame, ...newGameData };
    }

    registry.generatedAt = new Date().toISOString();
    await saveFileContent(REGISTRY_PATH, registry);
    return registry;
  },

  /**
   * Delete a specific version of a game
   */
  async deleteVersion(gameId: string, version: string): Promise<boolean> {
    const registry = await this.get();
    const gameIndex = registry.games.findIndex((g) => g.id === gameId);

    if (gameIndex === -1) return false;

    const game = registry.games[gameIndex];
    game.versions = game.versions.filter((v) => v !== version);

    if (game.versions.length === 0) {
      // No versions left, remove game entirely
      registry.games.splice(gameIndex, 1);
    } else {
      // Update latest version
      game.latest = game.versions[game.versions.length - 1];
      game.version = game.latest;
      game.entryUrl = `${CDN_BASE}/games/${gameId}/${game.latest}/index.html`;
    }

    registry.generatedAt = new Date().toISOString();
    await saveFileContent(REGISTRY_PATH, registry);
    return true;
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
