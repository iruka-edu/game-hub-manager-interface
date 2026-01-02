import { ObjectId, type Collection, type Db } from "mongodb";
import { getMongoClient } from "./mongodb";
import {
  MetadataAuditLog,
  ValidationResult,
  GameComplianceIssue,
  AuditReport,
  ComplianceStats
} from "./metadata-types";

/**
 * Metadata Audit Service
 * 
 * Provides comprehensive audit logging and compliance monitoring for metadata changes.
 * Tracks all metadata modifications, validation attempts, and system-wide compliance.
 */
export class MetadataAuditService {
  private auditCollection: Collection<MetadataAuditLog>;
  private gamesCollection: Collection;

  constructor(db: Db) {
    this.auditCollection = db.collection<MetadataAuditLog>("metadata_audit_logs");
    this.gamesCollection = db.collection("games");
  }

  /**
   * Get a MetadataAuditService instance
   */
  static async getInstance(): Promise<MetadataAuditService> {
    const { db } = await getMongoClient();
    return new MetadataAuditService(db);
  }

  /**
   * Log a metadata change event
   * 
   * @param gameId - Game MongoDB _id
   * @param action - Type of action performed
   * @param changes - Changes made to metadata
   * @param previousValues - Previous values before changes
   * @param userId - User who made the change
   * @param validationResult - Optional validation result
   * @returns Promise<ObjectId> - ID of the created audit log entry
   */
  async logMetadataChange(
    gameId: ObjectId,
    action: 'update' | 'validate' | 'publish_attempt' | 'config_change',
    changes: Record<string, any>,
    previousValues: Record<string, any>,
    userId: string,
    validationResult?: ValidationResult
  ): Promise<ObjectId> {
    const auditEntry: Omit<MetadataAuditLog, '_id'> = {
      gameId,
      action,
      changes,
      previousValues,
      userId,
      timestamp: new Date(),
      validationResult
    };

    const result = await this.auditCollection.insertOne(auditEntry as MetadataAuditLog);
    return result.insertedId;
  }

  /**
   * Get audit history for a specific game
   * 
   * @param gameId - Game ID (MongoDB _id or gameId string)
   * @param limit - Maximum number of entries to return
   * @param action - Optional filter by action type
   * @returns Promise<MetadataAuditLog[]>
   */
  async getGameAuditHistory(
    gameId: string, 
    limit: number = 50,
    action?: 'update' | 'validate' | 'publish_attempt' | 'config_change'
  ): Promise<MetadataAuditLog[]> {
    let gameObjectId: ObjectId;
    
    try {
      gameObjectId = new ObjectId(gameId);
    } catch {
      // If not a valid ObjectId, look up by gameId
      const game = await this.gamesCollection.findOne({ gameId, isDeleted: false });
      if (!game) {
        throw new Error(`Game not found: ${gameId}`);
      }
      gameObjectId = game._id;
    }

    const filter: any = { gameId: gameObjectId };
    if (action) {
      filter.action = action;
    }

    return await this.auditCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get audit history for a specific user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of entries to return
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Promise<MetadataAuditLog[]>
   */
  async getUserAuditHistory(
    userId: string,
    limit: number = 100,
    startDate?: Date,
    endDate?: Date
  ): Promise<MetadataAuditLog[]> {
    const filter: any = { userId };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    return await this.auditCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get system-wide audit statistics
   * 
   * @param startDate - Optional start date for statistics
   * @param endDate - Optional end date for statistics
   * @returns Promise<any> - Audit statistics
   */
  async getAuditStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalChanges: number;
    changesByAction: Record<string, number>;
    changesByUser: Record<string, number>;
    mostActiveGames: Array<{ gameId: string; changeCount: number }>;
    validationFailures: number;
  }> {
    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = startDate;
      if (endDate) matchStage.timestamp.$lte = endDate;
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $facet: {
          totalChanges: [{ $count: "count" }],
          changesByAction: [
            { $group: { _id: "$action", count: { $sum: 1 } } }
          ],
          changesByUser: [
            { $group: { _id: "$userId", count: { $sum: 1 } } }
          ],
          mostActiveGames: [
            { $group: { _id: "$gameId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          validationFailures: [
            { $match: { "validationResult.valid": false } },
            { $count: "count" }
          ]
        }
      }
    ];

    const [result] = await this.auditCollection.aggregate(pipeline).toArray();

    return {
      totalChanges: result.totalChanges[0]?.count || 0,
      changesByAction: result.changesByAction.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      changesByUser: result.changesByUser.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mostActiveGames: result.mostActiveGames.map((item: any) => ({
        gameId: item._id.toString(),
        changeCount: item.count
      })),
      validationFailures: result.validationFailures[0]?.count || 0
    };
  }

  /**
   * Get recent validation failures
   * 
   * @param limit - Maximum number of failures to return
   * @param hours - Number of hours to look back (default: 24)
   * @returns Promise<MetadataAuditLog[]>
   */
  async getRecentValidationFailures(limit: number = 50, hours: number = 24): Promise<MetadataAuditLog[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await this.auditCollection
      .find({
        timestamp: { $gte: cutoffDate },
        "validationResult.valid": false
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get games with frequent metadata changes (potential issues)
   * 
   * @param days - Number of days to analyze (default: 7)
   * @param minChanges - Minimum number of changes to be considered frequent (default: 10)
   * @returns Promise<Array<{ gameId: string; changeCount: number; lastChange: Date }>>
   */
  async getFrequentlyChangedGames(
    days: number = 7, 
    minChanges: number = 10
  ): Promise<Array<{ gameId: string; changeCount: number; lastChange: Date }>> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: cutoffDate },
          action: 'update'
        }
      },
      {
        $group: {
          _id: "$gameId",
          changeCount: { $sum: 1 },
          lastChange: { $max: "$timestamp" }
        }
      },
      {
        $match: {
          changeCount: { $gte: minChanges }
        }
      },
      {
        $sort: { changeCount: -1 }
      }
    ];

    const results = await this.auditCollection.aggregate(pipeline).toArray();
    
    return results.map(item => ({
      gameId: item._id.toString(),
      changeCount: item.changeCount,
      lastChange: item.lastChange
    }));
  }

  /**
   * Clean up old audit logs
   * 
   * @param olderThanDays - Remove logs older than this many days
   * @returns Promise<number> - Number of logs removed
   */
  async cleanupOldLogs(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const result = await this.auditCollection.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    return result.deletedCount;
  }

  /**
   * Export audit logs for external analysis
   * 
   * @param gameId - Optional game ID filter
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @param format - Export format ('json' | 'csv')
   * @returns Promise<string> - Exported data
   */
  async exportAuditLogs(
    gameId?: string,
    startDate?: Date,
    endDate?: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const filter: any = {};
    
    if (gameId) {
      try {
        filter.gameId = new ObjectId(gameId);
      } catch {
        const game = await this.gamesCollection.findOne({ gameId, isDeleted: false });
        if (game) {
          filter.gameId = game._id;
        }
      }
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    const logs = await this.auditCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .toArray();

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      if (logs.length === 0) return '';
      
      const headers = ['timestamp', 'gameId', 'action', 'userId', 'changes', 'validationResult'];
      const csvRows = [headers.join(',')];
      
      for (const log of logs) {
        const row = [
          log.timestamp.toISOString(),
          log.gameId.toString(),
          log.action,
          log.userId,
          JSON.stringify(log.changes).replace(/"/g, '""'),
          log.validationResult ? JSON.stringify(log.validationResult).replace(/"/g, '""') : ''
        ];
        csvRows.push(row.map(field => `"${field}"`).join(','));
      }
      
      return csvRows.join('\n');
    }
  }

  /**
   * Ensure database indexes for optimal performance
   */
  async ensureIndexes(): Promise<void> {
    await this.auditCollection.createIndex({ gameId: 1, timestamp: -1 });
    await this.auditCollection.createIndex({ userId: 1, timestamp: -1 });
    await this.auditCollection.createIndex({ action: 1, timestamp: -1 });
    await this.auditCollection.createIndex({ timestamp: -1 });
    await this.auditCollection.createIndex({ "validationResult.valid": 1 });
  }
}