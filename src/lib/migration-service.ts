import { ObjectId } from 'mongodb';
import type { Game } from '../models/Game';
import { GameRepository } from '../models/Game';
import type { GameVersion, VersionStatus } from '../models/GameVersion';
import { GameVersionRepository } from '../models/GameVersion';
import { generateStoragePath } from './storage-path';

/**
 * Old Game format (before versioning)
 */
export interface OldGame {
  _id: ObjectId;
  gameId: string;
  title: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  status: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  priority?: 'low' | 'medium' | 'high';
  selfQaChecklist?: unknown[];
  selfQaNote?: string;
  submittedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Migration result summary
 */
export interface MigrationResult {
  gamesProcessed: number;
  versionsCreated: number;
  errors: string[];
  skipped: number;
}

/**
 * Single game migration result
 */
export interface GameMigrationResult {
  game: Game;
  version: GameVersion;
}

/**
 * Migration Service
 * Migrates existing games from old model to versioning model
 */
export class MigrationService {
  private gameRepo: GameRepository;
  private versionRepo: GameVersionRepository;

  constructor(gameRepo: GameRepository, versionRepo: GameVersionRepository) {
    this.gameRepo = gameRepo;
    this.versionRepo = versionRepo;
  }

  /**
   * Create a MigrationService instance
   */
  static async getInstance(): Promise<MigrationService> {
    const gameRepo = await GameRepository.getInstance();
    const versionRepo = await GameVersionRepository.getInstance();
    return new MigrationService(gameRepo, versionRepo);
  }

  /**
   * Map old status to new VersionStatus
   */
  private mapStatus(oldStatus: string): VersionStatus {
    const statusMap: Record<string, VersionStatus> = {
      'draft': 'draft',
      'uploaded': 'uploaded',
      'qc_passed': 'qc_passed',
      'qc_failed': 'qc_failed',
      'approved': 'approved',
      'published': 'published',
      'archived': 'published' // Map archived to published
    };

    return statusMap[oldStatus] || 'draft';
  }

  /**
   * Migrate a single game from old format to new format
   * 
   * @param oldGame - Old game document
   * @returns Migrated game and version
   */
  async migrateGame(oldGame: OldGame): Promise<GameMigrationResult> {
    // Create new Game document (without status)
    const newGame: Omit<Game, '_id'> = {
      gameId: oldGame.gameId,
      title: oldGame.title,
      description: oldGame.description,
      ownerId: oldGame.ownerId,
      teamId: oldGame.teamId,
      subject: oldGame.subject,
      grade: oldGame.grade,
      unit: oldGame.unit,
      gameType: oldGame.gameType,
      priority: oldGame.priority,
      tags: [],
      isDeleted: oldGame.isDeleted,
      createdAt: oldGame.createdAt,
      updatedAt: oldGame.updatedAt,
    };

    // Insert new Game
    const gameResult = await this.gameRepo.create(newGame);

    // Create initial GameVersion (version 1.0.0)
    const version = '1.0.0';
    const storagePath = generateStoragePath(oldGame.gameId, version);
    const status = this.mapStatus(oldGame.status);

    const newVersion: Omit<GameVersion, '_id' | 'createdAt' | 'updatedAt'> = {
      gameId: gameResult._id,
      version,
      storagePath,
      entryFile: 'index.html',
      status,
      submittedBy: new ObjectId(oldGame.ownerId),
      submittedAt: oldGame.submittedAt,
      createdAt: oldGame.createdAt,
      updatedAt: oldGame.updatedAt,
    };

    // Insert GameVersion
    const versionResult = await this.versionRepo.create(newVersion);

    // Update Game with latestVersionId
    await this.gameRepo.updateLatestVersion(
      gameResult._id.toString(),
      versionResult._id
    );

    // If status is published, also set as liveVersionId
    if (status === 'published') {
      await this.gameRepo.updateLiveVersion(
        gameResult._id.toString(),
        versionResult._id
      );
    }

    return {
      game: gameResult,
      version: versionResult
    };
  }

  /**
   * Migrate all games from old format to new format
   * 
   * @param dryRun - If true, only simulate migration without making changes
   * @returns Migration result summary
   */
  async migrateAllGames(dryRun: boolean = false): Promise<MigrationResult> {
    const result: MigrationResult = {
      gamesProcessed: 0,
      versionsCreated: 0,
      errors: [],
      skipped: 0
    };

    try {
      // Get all games
      const allGames = await this.gameRepo.findAll();

      console.log(`[Migration] Found ${allGames.length} games to process`);

      for (const game of allGames) {
        try {
          // Check if game already has latestVersionId (already migrated)
          if (game.latestVersionId) {
            console.log(`[Migration] Skipping ${game.gameId} - already migrated`);
            result.skipped++;
            continue;
          }

          if (dryRun) {
            console.log(`[Migration] [DRY RUN] Would migrate: ${game.gameId}`);
            result.gamesProcessed++;
            result.versionsCreated++;
          } else {
            // Migrate the game
            const oldGame = game as unknown as OldGame;
            await this.migrateGame(oldGame);
            
            console.log(`[Migration] Migrated: ${game.gameId}`);
            result.gamesProcessed++;
            result.versionsCreated++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[Migration] Error migrating ${game.gameId}:`, errorMsg);
          result.errors.push(`${game.gameId}: ${errorMsg}`);
        }
      }

      console.log('[Migration] Complete:', result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Migration] Fatal error:', errorMsg);
      result.errors.push(`Fatal: ${errorMsg}`);
      return result;
    }
  }

  /**
   * Rollback migration for a single game
   * WARNING: This will delete the GameVersion and reset the Game
   * 
   * @param gameId - Game ID to rollback
   */
  async rollbackGame(gameId: string): Promise<void> {
    const game = await this.gameRepo.findByGameId(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // This is a simplified rollback - in production you'd want more sophisticated logic
    console.log(`[Migration] Rollback not fully implemented for: ${gameId}`);
    console.log('[Migration] Manual intervention may be required');
  }

  /**
   * Verify migration integrity
   * Checks that all games have corresponding versions
   * 
   * @returns Object with verification results
   */
  async verifyMigration(): Promise<{
    totalGames: number;
    migratedGames: number;
    unmigratedGames: number;
    issues: string[];
  }> {
    const allGames = await this.gameRepo.findAll();
    const issues: string[] = [];
    let migratedCount = 0;
    let unmigratedCount = 0;

    for (const game of allGames) {
      if (game.latestVersionId) {
        migratedCount++;
        
        // Verify version exists
        const version = await this.versionRepo.findById(game.latestVersionId.toString());
        if (!version) {
          issues.push(`Game ${game.gameId} has latestVersionId but version not found`);
        }
      } else {
        unmigratedCount++;
        issues.push(`Game ${game.gameId} not migrated (no latestVersionId)`);
      }
    }

    return {
      totalGames: allGames.length,
      migratedGames: migratedCount,
      unmigratedGames: unmigratedCount,
      issues
    };
  }
}
