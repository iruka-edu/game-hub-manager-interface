import { ObjectId, type Collection, type Db } from 'mongodb';
import { getMongoClient } from '../lib/mongodb';

/**
 * QC result types
 */
export type QcResult = 'pass' | 'fail';

/**
 * QC checklist item status
 */
export type QcItemStatus = 'ok' | 'warning' | 'fail';

/**
 * Severity levels for issues
 */
export type Severity = 'minor' | 'major' | 'critical';

/**
 * QC checklist item
 */
export interface QcChecklistItem {
  category: string;
  status: QcItemStatus;
  note?: string;
}

/**
 * Default QC checklist categories
 */
export const QC_CHECKLIST_CATEGORIES = [
  { id: 'ui_ux', label: 'UI/UX' },
  { id: 'audio', label: 'Âm thanh' },
  { id: 'performance', label: 'Hiệu năng' },
  { id: 'gameplay', label: 'Logic game' },
  { id: 'content', label: 'Nội dung' },
];

/**
 * QC Report interface
 */
export interface QcReport {
  _id: ObjectId;
  gameId: ObjectId;          // Reference to Game
  versionId: ObjectId;       // Reference to GameVersion
  reviewerId: ObjectId;      // Reference to User
  reviewerEmail: string;
  
  // Timing
  startedAt: Date;
  finishedAt: Date;
  
  // Results
  result: QcResult;
  severity?: Severity;       // Required if result is 'fail'
  checklist: QcChecklistItem[];
  note?: string;
  evidenceUrls?: string[];
  
  // Context
  attemptNumber: number;
  
  createdAt: Date;
}

/**
 * Input for creating a QC report
 */
export type CreateQcReportInput = Omit<QcReport, '_id' | 'createdAt'>;


/**
 * QC Report Repository
 */
export class QcReportRepository {
  private collection: Collection<QcReport>;

  constructor(db: Db) {
    this.collection = db.collection<QcReport>('qc_reports');
  }

  static async getInstance(): Promise<QcReportRepository> {
    const { db } = await getMongoClient();
    return new QcReportRepository(db);
  }

  /**
   * Create a new QC report with validation
   */
  async create(input: CreateQcReportInput): Promise<QcReport> {
    // Validate required fields
    if (!input.gameId) {
      throw new Error('gameId is required');
    }
    if (!input.versionId) {
      throw new Error('versionId is required');
    }
    if (!input.reviewerId) {
      throw new Error('reviewerId is required');
    }
    if (!input.result) {
      throw new Error('result is required');
    }
    
    // Validate severity required for fail
    if (input.result === 'fail' && !input.severity) {
      throw new Error('severity is required when result is "fail"');
    }

    const report: Omit<QcReport, '_id'> = {
      ...input,
      createdAt: new Date(),
    };

    const result = await this.collection.insertOne(report as QcReport);
    return { ...report, _id: result.insertedId } as QcReport;
  }

  /**
   * Find QC reports by game ID
   */
  async findByGameId(gameId: string): Promise<QcReport[]> {
    try {
      return this.collection
        .find({ gameId: new ObjectId(gameId) })
        .sort({ createdAt: -1 })
        .toArray();
    } catch {
      return [];
    }
  }

  /**
   * Find QC reports by version ID
   */
  async findByVersionId(versionId: string): Promise<QcReport[]> {
    try {
      return this.collection
        .find({ versionId: new ObjectId(versionId) })
        .sort({ createdAt: -1 })
        .toArray();
    } catch {
      return [];
    }
  }

  /**
   * Get the latest QC report for a game
   */
  async getLatestByGameId(gameId: string): Promise<QcReport | null> {
    try {
      return this.collection.findOne(
        { gameId: new ObjectId(gameId) },
        { sort: { createdAt: -1 } }
      );
    } catch {
      return null;
    }
  }

  /**
   * Get the latest QC report for a version
   */
  async getLatestByVersionId(versionId: string): Promise<QcReport | null> {
    try {
      return this.collection.findOne(
        { versionId: new ObjectId(versionId) },
        { sort: { createdAt: -1 } }
      );
    } catch {
      return null;
    }
  }

  /**
   * Count QC attempts for a game
   */
  async countAttempts(gameId: string): Promise<number> {
    try {
      return this.collection.countDocuments({ gameId: new ObjectId(gameId) });
    } catch {
      return 0;
    }
  }

  /**
   * Find QC reports by reviewer
   */
  async findByReviewerId(reviewerId: string): Promise<QcReport[]> {
    try {
      return this.collection
        .find({ reviewerId: new ObjectId(reviewerId) })
        .sort({ createdAt: -1 })
        .toArray();
    } catch {
      return [];
    }
  }

  /**
   * Ensure indexes
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ gameId: 1 });
    await this.collection.createIndex({ versionId: 1 });
    await this.collection.createIndex({ reviewerId: 1 });
    await this.collection.createIndex({ createdAt: -1 });
    await this.collection.createIndex({ gameId: 1, attemptNumber: 1 });
  }
}
