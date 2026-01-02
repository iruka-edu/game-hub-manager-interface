import { ObjectId, type Collection, type Db } from "mongodb";
import { getMongoClient } from "./mongodb";
import {
  GameMetadata,
  MetadataCompleteness,
  DEFAULT_MANDATORY_FIELDS,
  calculateCompleteness,
  getMissingFields
} from './metadata-types';

/**
 * Completeness Tracking Service
 * 
 * Provides real-time metadata completeness tracking and progress monitoring.
 * Maintains completeness statistics and provides insights for improving metadata quality.
 */
export class CompletenessTracker {
  private gamesCollection: Collection;
  private configCollection: Collection;

  constructor(db: Db) {
    this.gamesCollection = db.collection("games");
    this.configCollection = db.collection("metadata_config");
  }

  /**
   * Get a CompletenessTracker instance
   */
  static async getInstance(): Promise<CompletenessTracker> {
    const { db } = await getMongoClient();
    return new CompletenessTracker(db);
  }

  /**
   * Calculate detailed completeness information for a game's metadata
   * 
   * @param metadata - Game metadata to analyze
   * @param customRequiredFields - Optional custom required fields list
   * @returns Promise<MetadataCompleteness>
   */
  async calculateDetailedCompleteness(
    metadata: GameMetadata,
    customRequiredFields?: string[]
  ): Promise<MetadataCompleteness> {
    const requiredFields = customRequiredFields || await this.getMandatoryFields();
    const missingFields = getMissingFields(metadata, requiredFields);
    const completedFields = requiredFields.filter(field => !missingFields.includes(field));
    const percentage = calculateCompleteness(metadata, requiredFields);

    // Get all possible optional fields
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
   * Update completeness percentage for a specific game
   * 
   * @param gameId - Game ID (MongoDB _id or gameId string)
   * @returns Promise<number> - Updated completeness percentage
   */
  async updateGameCompleteness(gameId: string): Promise<number> {
    const game = await this.getGameById(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    const metadata = game.metadata || {};
    const completeness = await this.calculateDetailedCompleteness(metadata);

    // Update the game document with new completeness
    await this.gamesCollection.updateOne(
      { _id: game._id },
      { 
        $set: { 
          metadataCompleteness: completeness.percentage,
          lastMetadataUpdate: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    return completeness.percentage;
  }

  /**
   * Get completeness statistics for all games
   * 
   * @param includeDeleted - Whether to include soft-deleted games
   * @returns Promise<CompletenessStatistics>
   */
  async getSystemCompletenessStats(includeDeleted: boolean = false): Promise<{
    totalGames: number;
    averageCompleteness: number;
    fullyCompleteGames: number;
    incompleteGames: number;
    completenessDistribution: { range: string; count: number }[];
    mostMissingFields: { field: string; missingCount: number }[];
  }> {
    const filter: any = {};
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    const pipeline = [
      { $match: filter },
      {
        $facet: {
          totalGames: [{ $count: "count" }],
          completenessStats: [
            {
              $group: {
                _id: null,
                avgCompleteness: { $avg: "$metadataCompleteness" },
                fullyComplete: {
                  $sum: { $cond: [{ $eq: ["$metadataCompleteness", 100] }, 1, 0] }
                },
                incomplete: {
                  $sum: { $cond: [{ $lt: ["$metadataCompleteness", 100] }, 1, 0] }
                }
              }
            }
          ],
          completenessDistribution: [
            {
              $bucket: {
                groupBy: "$metadataCompleteness",
                boundaries: [0, 25, 50, 75, 100, 101],
                default: "unknown",
                output: { count: { $sum: 1 } }
              }
            }
          ],
          missingFieldsAnalysis: [
            { $match: { metadata: { $exists: true } } },
            {
              $project: {
                missingFields: {
                  $filter: {
                    input: await this.getMandatoryFields(),
                    as: "field",
                    cond: {
                      $or: [
                        { $eq: [{ $type: { $getField: { field: "$$field", input: "$metadata" } } }, "missing"] },
                        { $eq: [{ $getField: { field: "$$field", input: "$metadata" } }, null] },
                        { $eq: [{ $getField: { field: "$$field", input: "$metadata" } }, ""] }
                      ]
                    }
                  }
                }
              }
            },
            { $unwind: "$missingFields" },
            {
              $group: {
                _id: "$missingFields",
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ];

    const [result] = await this.gamesCollection.aggregate(pipeline).toArray();

    const totalGames = result.totalGames[0]?.count || 0;
    const stats = result.completenessStats[0] || {};
    
    return {
      totalGames,
      averageCompleteness: Math.round(stats.avgCompleteness || 0),
      fullyCompleteGames: stats.fullyComplete || 0,
      incompleteGames: stats.incomplete || 0,
      completenessDistribution: result.completenessDistribution.map((bucket: any) => ({
        range: this.getCompletenessRangeLabel(bucket._id),
        count: bucket.count
      })),
      mostMissingFields: result.missingFieldsAnalysis.map((item: any) => ({
        field: item._id,
        missingCount: item.count
      }))
    };
  }

  /**
   * Get games with low completeness that need attention
   * 
   * @param threshold - Completeness threshold (default: 50%)
   * @param limit - Maximum number of games to return
   * @returns Promise<Array<GameCompletenessInfo>>
   */
  async getIncompleteGames(
    threshold: number = 50,
    limit: number = 50
  ): Promise<Array<{
    gameId: string;
    title: string;
    ownerId: string;
    completeness: number;
    missingFields: string[];
    lastUpdate: Date;
  }>> {
    const requiredFields = await this.getMandatoryFields();
    
    const games = await this.gamesCollection
      .find({
        isDeleted: false,
        $or: [
          { metadataCompleteness: { $lt: threshold } },
          { metadataCompleteness: { $exists: false } }
        ]
      })
      .sort({ metadataCompleteness: 1, lastMetadataUpdate: 1 })
      .limit(limit)
      .toArray();

    const result = [];
    for (const game of games) {
      const metadata = game.metadata || {};
      const missingFields = getMissingFields(metadata, requiredFields);
      const completeness = calculateCompleteness(metadata, requiredFields);

      result.push({
        gameId: game.gameId,
        title: game.title,
        ownerId: game.ownerId,
        completeness,
        missingFields,
        lastUpdate: game.lastMetadataUpdate || game.updatedAt || game.createdAt
      });
    }

    return result;
  }

  /**
   * Get completeness progress for a specific user's games
   * 
   * @param userId - User ID
   * @returns Promise<UserCompletenessProgress>
   */
  async getUserCompletenessProgress(userId: string): Promise<{
    totalGames: number;
    averageCompleteness: number;
    completeGames: number;
    incompleteGames: number;
    recentlyUpdated: Array<{ gameId: string; title: string; completeness: number }>;
  }> {
    const userGames = await this.gamesCollection
      .find({ ownerId: userId, isDeleted: false })
      .toArray();

    if (userGames.length === 0) {
      return {
        totalGames: 0,
        averageCompleteness: 0,
        completeGames: 0,
        incompleteGames: 0,
        recentlyUpdated: []
      };
    }

    let totalCompleteness = 0;
    let completeGames = 0;
    const recentlyUpdated = [];

    for (const game of userGames) {
      const completeness = game.metadataCompleteness || 0;
      totalCompleteness += completeness;
      
      if (completeness === 100) {
        completeGames++;
      }

      if (game.lastMetadataUpdate) {
        recentlyUpdated.push({
          gameId: game.gameId,
          title: game.title,
          completeness,
          lastUpdate: game.lastMetadataUpdate
        });
      }
    }

    // Sort recently updated by date
    recentlyUpdated.sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());

    return {
      totalGames: userGames.length,
      averageCompleteness: Math.round(totalCompleteness / userGames.length),
      completeGames,
      incompleteGames: userGames.length - completeGames,
      recentlyUpdated: recentlyUpdated.slice(0, 10)
    };
  }

  /**
   * Batch update completeness for all games
   * Useful for system maintenance or after configuration changes
   * 
   * @param batchSize - Number of games to process at once
   * @returns Promise<number> - Number of games updated
   */
  async batchUpdateAllCompleteness(batchSize: number = 100): Promise<number> {
    let updatedCount = 0;
    let skip = 0;

    while (true) {
      const games = await this.gamesCollection
        .find({ isDeleted: false })
        .skip(skip)
        .limit(batchSize)
        .toArray();

      if (games.length === 0) break;

      const bulkOps = [];
      const requiredFields = await this.getMandatoryFields();

      for (const game of games) {
        const metadata = game.metadata || {};
        const completeness = calculateCompleteness(metadata, requiredFields);

        bulkOps.push({
          updateOne: {
            filter: { _id: game._id },
            update: {
              $set: {
                metadataCompleteness: completeness,
                updatedAt: new Date()
              }
            }
          }
        });
      }

      if (bulkOps.length > 0) {
        await this.gamesCollection.bulkWrite(bulkOps);
        updatedCount += bulkOps.length;
      }

      skip += batchSize;
    }

    return updatedCount;
  }

  /**
   * Get completeness trend over time
   * 
   * @param days - Number of days to analyze
   * @returns Promise<Array<{ date: string; averageCompleteness: number }>>
   */
  async getCompletenessTrend(days: number = 30): Promise<Array<{
    date: string;
    averageCompleteness: number;
    gamesUpdated: number;
  }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          lastMetadataUpdate: { $gte: startDate },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$lastMetadataUpdate"
            }
          },
          avgCompleteness: { $avg: "$metadataCompleteness" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const results = await this.gamesCollection.aggregate(pipeline).toArray();

    return results.map(item => ({
      date: item._id,
      averageCompleteness: Math.round(item.avgCompleteness || 0),
      gamesUpdated: item.count
    }));
  }

  /**
   * Get game by ID with support for both MongoDB _id and gameId
   */
  private async getGameById(gameId: string): Promise<any> {
    try {
      const byObjectId = await this.gamesCollection.findOne({ _id: new ObjectId(gameId) });
      if (byObjectId) return byObjectId;
    } catch {
      // Not a valid ObjectId
    }

    return await this.gamesCollection.findOne({ gameId, isDeleted: false });
  }

  /**
   * Get mandatory fields from configuration
   */
  private async getMandatoryFields(): Promise<string[]> {
    // TODO: Read from metadata_config collection when implemented
    return DEFAULT_MANDATORY_FIELDS;
  }

  /**
   * Get human-readable label for completeness range
   */
  private getCompletenessRangeLabel(bucketId: number): string {
    switch (bucketId) {
      case 0: return '0-24%';
      case 25: return '25-49%';
      case 50: return '50-74%';
      case 75: return '75-99%';
      case 100: return '100%';
      default: return 'Unknown';
    }
  }

  /**
   * Ensure database indexes for optimal performance
   */
  async ensureIndexes(): Promise<void> {
    await this.gamesCollection.createIndex({ metadataCompleteness: 1 });
    await this.gamesCollection.createIndex({ lastMetadataUpdate: -1 });
    await this.gamesCollection.createIndex({ ownerId: 1, metadataCompleteness: 1 });
    await this.gamesCollection.createIndex({ isDeleted: 1, metadataCompleteness: 1 });
  }
}