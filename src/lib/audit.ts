import { getMongoClient } from './mongodb';
import type { User } from '../models/User';
import type {
  ActionType,
  AuditLogEntry,
  AuditTarget,
  AuditChange,
  AuditLogFilter,
} from './audit-types';

/**
 * Parameters for logging an audit entry
 */
export interface LogParams {
  actor: {
    user: User;
    ip?: string;
    userAgent?: string;
  };
  action: ActionType;
  target: AuditTarget;
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
}

/**
 * AuditLogger service for recording and querying audit logs
 */
export const AuditLogger = {
  /**
   * Log an audit entry to the database.
   * This method is fire-and-forget - errors are caught and logged
   * without interrupting the main operation.
   */
  async log(params: LogParams): Promise<void> {
    try {
      const { db } = await getMongoClient();
      const collection = db.collection<AuditLogEntry>('audit_logs');

      const entry: Omit<AuditLogEntry, '_id'> = {
        actor: {
          userId: params.actor.user._id.toString(),
          email: params.actor.user.email,
          role: params.actor.user.roles[0] || 'unknown',
          ip: params.actor.ip || 'unknown',
          userAgent: params.actor.userAgent,
        },
        action: params.action,
        target: params.target,
        changes: params.changes,
        metadata: params.metadata,
        createdAt: new Date(),
      };

      await collection.insertOne(entry as AuditLogEntry);
    } catch (error) {
      // Never let audit logging errors interrupt main operations
      console.error('[AuditLogger] Failed to write audit log:', error);
    }
  },

  /**
   * Get audit logs with filtering and pagination
   */
  async getLogs(
    filter: AuditLogFilter = {},
    limit: number = 50,
    skip: number = 0
  ): Promise<AuditLogEntry[]> {
    const { db } = await getMongoClient();
    const collection = db.collection<AuditLogEntry>('audit_logs');

    const query = buildQuery(filter);

    return collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  },

  /**
   * Get total count of audit logs matching filter
   */
  async getLogsCount(filter: AuditLogFilter = {}): Promise<number> {
    const { db } = await getMongoClient();
    const collection = db.collection<AuditLogEntry>('audit_logs');

    const query = buildQuery(filter);

    return collection.countDocuments(query);
  },

  /**
   * Ensure required indexes exist on the audit_logs collection
   */
  async ensureIndexes(): Promise<void> {
    const { db } = await getMongoClient();
    const collection = db.collection<AuditLogEntry>('audit_logs');

    // Index for querying by game ID
    await collection.createIndex({ 'target.id': 1 });

    // Index for querying by user
    await collection.createIndex({ 'actor.userId': 1 });

    // Index for sorting by time (most common query pattern)
    await collection.createIndex({ createdAt: -1 });

    // TTL index: auto-delete logs older than 90 days (7776000 seconds)
    await collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7776000 }
    );

    console.log('[AuditLogger] Indexes created successfully');
  },
};

/**
 * Build MongoDB query from filter options
 */
function buildQuery(filter: AuditLogFilter): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filter.userId) {
    query['actor.userId'] = filter.userId;
  }

  if (filter.action) {
    query.action = filter.action;
  }

  if (filter.targetId) {
    query['target.id'] = filter.targetId;
  }

  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) {
      (query.createdAt as Record<string, Date>).$gte = filter.startDate;
    }
    if (filter.endDate) {
      (query.createdAt as Record<string, Date>).$lte = filter.endDate;
    }
  }

  return query;
}
