import { ObjectId, type Collection, type Db } from "mongodb";
import { getMongoClient } from "./mongodb";
import {
  GameMetadata,
  GameWithMetadata,
  MetadataCompleteness,
  ValidationResult,
  MetadataAuditLog,
  DEFAULT_MANDATORY_FIELDS,
  calculateCompleteness,
  getMissingFields,
  hasMetadata
} from "./metadata-types";
import { Game } from "../models/Game";

/**
 * Core Metadata Management Service
 * 
 * Provides comprehensive metadata management capabilities including:
 * - Incremental metadata updates using MongoDB dot notation
 * - Backward compatibility with legacy games
 * - Completeness calculation and tracking
 * - Audit logging for all metadata changes
 */
export class MetadataService {
  private gamesCollection: Collection<Game>;
  private auditCollection: Collection<MetadataAuditLog>;

  constructor(db: Db) {
    this.gamesCollection = db.collection<Game>("games");
    this.auditCollection = db.collection<MetadataAuditLog>("metadata_audit_logs");
  }

  /**
   * Get a MetadataService instance
   */
  static async getInstance(): Promise<MetadataService> {
    const { db } = await getMongoClient();
    return new MetadataService(db);
  }

  /**
   * Update game metadata using dot notation for incremental updates
   * Preserves existing metadata fields when updating unrelated fields
   * 
   * @param gameId - Game ID (MongoDB _id or gameId string)
   * @param newMetadata - Partial metadata to update
   * @param userId - User making the change (for audit logging)
   * @returns Promise<void>
   */
  async updateGameMetadata(
    gameId: string, 
    newMetadata: Partial<GameMetadata>, 
    userId: string
  ): Promise<void> {
    // Find the game first to get current metadata for audit logging
    const game = await this.getGameById(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    const currentMetadata = game.metadata || {};
    
    // Prepare update operations using dot notation
    const updateData: Record<string, any> = {};
    const unsetData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(newMetadata)) {
      if (value === null || value === undefined) {
        // Remove field if set to null/undefined
        unsetData[`metadata.${key}`] = "";
      } else {
        // Update field value
        updateData[`metadata.${key}`] = value;
      }
    }

    // Ensure metadata object exists for legacy games
    if (!game.metadata) {
      updateData['metadata'] = {};
    }

    // Build MongoDB update operation
    const updateOperation: any = {
      $set: {
        ...updateData,
        updatedAt: new Date(),
        lastMetadataUpdate: new Date()
      }
    };

    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }

    // Perform the update
    const result = await this.gamesCollection.updateOne(
      { $or: [{ _id: new ObjectId(gameId) }, { gameId }] },
      updateOperation
    );

    if (result.matchedCount === 0) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // Calculate new completeness after update
    const updatedGame = await this.getGameById(gameId);
    if (updatedGame) {
      const completeness = await this.calculateCompleteness(updatedGame.metadata || {});
      
      // Update completeness percentage
      await this.gamesCollection.updateOne(
        { $or: [{ _id: new ObjectId(gameId) }, { gameId }] },
        { $set: { metadataCompleteness: completeness.percentage } }
      );
    }

    // Log the change for audit trail
    await this.logMetadataChange(
      game._id,
      'update',
      newMetadata,
      currentMetadata,
      userId
    );
  }

  /**
   * Get game metadata with backward compatibility
   * Creates empty metadata object for legacy games
   * 
   * @param gameId - Game ID (MongoDB _id or gameId string)
   * @returns Promise<GameMetadata>
   */
  async getGameMetadata(gameId: string): Promise<GameMetadata> {
    const game = await this.getGameById(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // Return metadata or empty object for legacy games
    return game.metadata || {};
  }

  /**
   * Calculate metadata completeness for a given metadata object
   * 
   * @param metadata - Metadata to analyze
   * @param customRequiredFields - Optional custom required fields list
   * @returns Promise<MetadataCompleteness>
   */
  async calculateCompleteness(
    metadata: GameMetadata, 
    customRequiredFields?: string[]
  ): Promise<MetadataCompleteness> {
    const requiredFields = customRequiredFields || await this.getMandatoryFields();
    const missingFields = getMissingFields(metadata, requiredFields);
    const completedFields = requiredFields.filter(field => !missingFields.includes(field));
    const percentage = calculateCompleteness(metadata, requiredFields);

    // Get all possible optional fields from default config
    const allPossibleFields = [
      'gameType', 'subject', 'grade', 'textbook', 'lessonNo', 'lessonSummary',
      'theme_primary', 'theme_secondary', 'context_tags', 'difficulty_levels', 'thumbnailUrl'
    ];
    const optionalFields = allPossibleFields.filter(field => !requiredFields.includes(field));

    return {
      percentage,
      requiredFields,
      missingFields,
      optionalFields,
      completedFields
    };
  }

  /**
   * Validate metadata format (permissive validation for development)
   * 
   * @param metadata - Metadata to validate
   * @returns ValidationResult
   */
  validateMetadataFormat(metadata: GameMetadata): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Type validation
    if (metadata.lessonNo !== undefined && typeof metadata.lessonNo !== 'number') {
      errors.push('lessonNo must be a number');
    }

    if (metadata.theme_secondary !== undefined && !Array.isArray(metadata.theme_secondary)) {
      errors.push('theme_secondary must be an array');
    }

    if (metadata.context_tags !== undefined && !Array.isArray(metadata.context_tags)) {
      errors.push('context_tags must be an array');
    }

    if (metadata.difficulty_levels !== undefined && !Array.isArray(metadata.difficulty_levels)) {
      errors.push('difficulty_levels must be an array');
    }

    // URL validation for thumbnailUrl
    if (metadata.thumbnailUrl !== undefined && metadata.thumbnailUrl !== '') {
      try {
        new URL(metadata.thumbnailUrl);
      } catch {
        // Check if it's a relative path
        if (!metadata.thumbnailUrl.startsWith('/') && !metadata.thumbnailUrl.startsWith('./')) {
          warnings.push('thumbnailUrl should be a valid URL or relative path');
        }
      }
    }

    // Suggestions for improvement
    if (!metadata.lessonSummary) {
      suggestions.push('Consider adding a lesson summary to help users understand the content');
    }

    if (!metadata.theme_primary) {
      suggestions.push('Adding a primary theme helps with categorization');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get game by ID with support for both MongoDB _id and gameId
   * 
   * @param gameId - Game ID (MongoDB _id or gameId string)
   * @returns Promise<Game | null>
   */
  private async getGameById(gameId: string): Promise<Game | null> {
    try {
      // Try MongoDB _id first
      const byObjectId = await this.gamesCollection.findOne({ _id: new ObjectId(gameId) });
      if (byObjectId) return byObjectId;
    } catch {
      // Not a valid ObjectId, continue to gameId lookup
    }

    // Try gameId lookup
    return await this.gamesCollection.findOne({ gameId, isDeleted: false });
  }

  /**
   * Get mandatory fields for publishing (configurable)
   * For now, returns default fields, but can be extended to read from configuration
   * 
   * @returns Promise<string[]>
   */
  private async getMandatoryFields(): Promise<string[]> {
    // TODO: In future, read from metadata_config collection
    return DEFAULT_MANDATORY_FIELDS;
  }

  /**
   * Log metadata changes for audit trail
   * 
   * @param gameId - Game MongoDB _id
   * @param action - Type of action performed
   * @param changes - Changes made
   * @param previousValues - Previous values
   * @param userId - User who made the change
   * @returns Promise<void>
   */
  private async logMetadataChange(
    gameId: ObjectId,
    action: 'update' | 'validate' | 'publish_attempt' | 'config_change',
    changes: Record<string, any>,
    previousValues: Record<string, any>,
    userId: string,
    validationResult?: ValidationResult
  ): Promise<void> {
    const auditEntry: Omit<MetadataAuditLog, '_id'> = {
      gameId,
      action,
      changes,
      previousValues,
      userId,
      timestamp: new Date(),
      validationResult
    };

    await this.auditCollection.insertOne(auditEntry as MetadataAuditLog);
  }

  /**
   * Get metadata audit history for a game
   * 
   * @param gameId - Game ID
   * @param limit - Maximum number of entries to return
   * @returns Promise<MetadataAuditLog[]>
   */
  async getMetadataHistory(gameId: string, limit: number = 50): Promise<MetadataAuditLog[]> {
    const game = await this.getGameById(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    return await this.auditCollection
      .find({ gameId: game._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Migrate legacy game to include metadata object
   * Creates empty metadata object for games that don't have one
   * 
   * @param gameId - Game ID
   * @returns Promise<void>
   */
  async migrateLegacyGame(gameId: string): Promise<void> {
    const game = await this.getGameById(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // Only migrate if metadata doesn't exist
    if (!game.metadata) {
      await this.gamesCollection.updateOne(
        { _id: game._id },
        { 
          $set: { 
            metadata: {},
            metadataCompleteness: 0,
            lastMetadataUpdate: new Date(),
            updatedAt: new Date()
          } 
        }
      );

      // Log the migration
      await this.logMetadataChange(
        game._id,
        'update',
        { metadata: {} },
        {},
        'system-migration'
      );
    }
  }

  /**
   * Batch migrate all legacy games
   * Useful for system-wide migration
   * 
   * @returns Promise<number> - Number of games migrated
   */
  async migrateAllLegacyGames(): Promise<number> {
    const legacyGames = await this.gamesCollection
      .find({ 
        metadata: { $exists: false },
        isDeleted: false 
      })
      .toArray();

    let migratedCount = 0;
    for (const game of legacyGames) {
      try {
        await this.migrateLegacyGame(game._id.toString());
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate game ${game._id}:`, error);
      }
    }

    return migratedCount;
  }

  /**
   * Ensure database indexes for optimal performance
   */
  async ensureIndexes(): Promise<void> {
    // Index for metadata queries
    await this.gamesCollection.createIndex({ "metadata.gameType": 1 });
    await this.gamesCollection.createIndex({ "metadata.subject": 1 });
    await this.gamesCollection.createIndex({ "metadata.grade": 1 });
    await this.gamesCollection.createIndex({ metadataCompleteness: 1 });
    await this.gamesCollection.createIndex({ lastMetadataUpdate: 1 });

    // Audit log indexes
    await this.auditCollection.createIndex({ gameId: 1, timestamp: -1 });
    await this.auditCollection.createIndex({ userId: 1 });
    await this.auditCollection.createIndex({ action: 1 });
  }
}