import { ObjectId, type Collection, type Db } from "mongodb";
import { getMongoClient } from "../lib/mongodb";
import type {
  QA01Result,
  QA02Result,
  QA03Result,
  QA04Result,
} from "./GameVersion";

/**
 * Game event types captured during testing
 */
export type GameEventType =
  | "INIT"
  | "READY"
  | "RESULT"
  | "QUIT"
  | "COMPLETE"
  | "ERROR";

/**
 * Individual game event in the timeline
 */
export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  data?: any;
}

/**
 * QC decision types
 */
export type QCDecision = "pass" | "fail";

/**
 * Comprehensive QC Report interface
 */
export interface QCReport {
  _id: ObjectId;
  gameId: ObjectId; // Reference to Game
  versionId: ObjectId; // Reference to GameVersion
  qcUserId: ObjectId; // Reference to QC User

  // Individual QA Test Results
  qa01: QA01Result;
  qa02: QA02Result;
  qa03: QA03Result;
  qa04: QA04Result;

  // Comprehensive Test Data
  rawResult: object; // Raw results from game testing
  eventsTimeline: GameEvent[]; // Complete event timeline

  // QC Decision
  decision: QCDecision;
  note: string;

  // Metadata
  testStartedAt: Date;
  testCompletedAt: Date;
  createdAt: Date;
}

/**
 * Input type for creating a new QC Report
 */
export type CreateQCReportInput = Omit<QCReport, "_id" | "createdAt">;

/**
 * QC Report Repository for CRUD operations
 */
export class QCReportRepository {
  private collection: Collection<QCReport>;

  constructor(db: Db) {
    this.collection = db.collection<QCReport>("qc_reports");
  }

  /**
   * Get a QCReportRepository instance
   */
  static async getInstance(): Promise<QCReportRepository> {
    const { db } = await getMongoClient();
    return new QCReportRepository(db);
  }

  /**
   * Create a new QC report with validation
   */
  async create(input: CreateQCReportInput): Promise<QCReport> {
    // Validate required fields
    if (!input.gameId) {
      throw new Error("gameId is required");
    }
    if (!input.versionId) {
      throw new Error("versionId is required");
    }
    if (!input.qcUserId) {
      throw new Error("qcUserId is required");
    }
    if (!input.decision) {
      throw new Error("decision is required");
    }

    // Validate decision type
    if (!["pass", "fail"].includes(input.decision)) {
      throw new Error('decision must be "pass" or "fail"');
    }

    // Validate QA results structure
    if (!input.qa01 || typeof input.qa01.pass !== "boolean") {
      throw new Error("qa01 result with pass boolean is required");
    }
    if (!input.qa02 || typeof input.qa02.pass !== "boolean") {
      throw new Error("qa02 result with pass boolean is required");
    }
    if (!input.qa03) {
      throw new Error("qa03 result is required");
    }
    if (!input.qa04 || typeof input.qa04.pass !== "boolean") {
      throw new Error("qa04 result with pass boolean is required");
    }

    const now = new Date();
    const report: Omit<QCReport, "_id"> = {
      ...input,
      createdAt: now,
    };

    const result = await this.collection.insertOne(report as QCReport);
    return { ...report, _id: result.insertedId } as QCReport;
  }

  /**
   * Find QC reports by game ID
   */
  async findByGameId(gameId: string): Promise<QCReport[]> {
    try {
      if (!ObjectId.isValid(gameId)) {
        return [];
      }
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
  async findByVersionId(versionId: string): Promise<QCReport[]> {
    try {
      if (!ObjectId.isValid(versionId)) {
        return [];
      }
      return this.collection
        .find({ versionId: new ObjectId(versionId) })
        .sort({ createdAt: -1 })
        .toArray();
    } catch {
      return [];
    }
  }

  /**
   * Get the latest QC report for a version
   */
  async getLatestByVersionId(versionId: string): Promise<QCReport | null> {
    try {
      if (!ObjectId.isValid(versionId)) {
        return null;
      }
      return this.collection.findOne(
        { versionId: new ObjectId(versionId) },
        { sort: { createdAt: -1 } }
      );
    } catch {
      return null;
    }
  }

  /**
   * Find QC reports by QC user
   */
  async findByQCUserId(qcUserId: string): Promise<QCReport[]> {
    try {
      if (!ObjectId.isValid(qcUserId)) {
        return [];
      }
      return this.collection
        .find({ qcUserId: new ObjectId(qcUserId) })
        .sort({ createdAt: -1 })
        .toArray();
    } catch {
      return [];
    }
  }

  /**
   * Count QC reports for a game (for attempt numbering)
   */
  async countByGameId(gameId: string): Promise<number> {
    try {
      if (!ObjectId.isValid(gameId)) {
        return 0;
      }
      return this.collection.countDocuments({ gameId: new ObjectId(gameId) });
    } catch {
      return 0;
    }
  }

  /**
   * Find a QC report by ID
   */
  async findById(id: string): Promise<QCReport | null> {
    try {
      if (!ObjectId.isValid(id)) {
        return null;
      }
      return this.collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  /**
   * Ensure indexes are created for optimal performance
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ versionId: 1 });
    await this.collection.createIndex({ gameId: 1, createdAt: -1 });
    await this.collection.createIndex({ qcUserId: 1 });
    await this.collection.createIndex({ decision: 1 });
    await this.collection.createIndex({ createdAt: -1 });
  }
}
