import { ObjectId, type Collection, type Db } from 'mongodb';
import { getMongoClient } from '../lib/mongodb';

/**
 * Version status in the workflow
 */
export type VersionStatus = 
  | 'draft'           // Dev is working on it
  | 'uploaded'        // Submitted to QC, waiting
  | 'qc_processing'   // QC is actively testing
  | 'qc_passed'       // QC approved
  | 'qc_failed'       // QC rejected
  | 'approved'        // CTO/Admin approved
  | 'published'       // Live for users
  | 'archived';       // Removed from public, preserved in DB

/**
 * Valid version statuses for validation
 */
export const VALID_VERSION_STATUSES: VersionStatus[] = [
  'draft',
  'uploaded',
  'qc_processing',
  'qc_passed',
  'qc_failed',
  'approved',
  'published',
  'archived'
];

/**
 * Self-QA checklist structure
 */
export interface SelfQAChecklist {
  testedDevices: boolean;
  testedAudio: boolean;
  gameplayComplete: boolean;
  contentVerified: boolean;
  note?: string;
}

/**
 * GameVersion interface representing a specific build version
 */
export interface GameVersion {
  _id: ObjectId;
  gameId: ObjectId;          // Reference to Game
  version: string;           // SemVer (e.g., "1.0.1")
  
  // Storage
  storagePath: string;       // "games/{slug}/{version}/"
  entryFile: string;         // "index.html"
  buildSize?: number;        // Bytes
  
  // Status
  status: VersionStatus;
  isDeleted: boolean;        // Soft delete flag
  
  // Self-QA
  selfQAChecklist?: SelfQAChecklist;
  releaseNote?: string;      // What changed in this version
  
  // Submission
  submittedBy: ObjectId;     // User._id
  submittedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new GameVersion
 */
export type CreateGameVersionInput = Omit<GameVersion, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Validate that a status is valid
 */
export function isValidVersionStatus(status: string): status is VersionStatus {
  return VALID_VERSION_STATUSES.includes(status as VersionStatus);
}

/**
 * Validate SemVer format (X.Y.Z where X, Y, Z are non-negative integers)
 */
export function isValidSemVer(version: string): boolean {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  return semverRegex.test(version);
}

/**
 * Parse SemVer string into components
 */
export function parseSemVer(version: string): { major: number; minor: number; patch: number } | null {
  if (!isValidSemVer(version)) {
    return null;
  }
  const parts = version.split('.').map(Number);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2]
  };
}

/**
 * Increment patch version (X.Y.Z -> X.Y.Z+1)
 */
export function incrementPatchVersion(version: string): string {
  const parsed = parseSemVer(version);
  if (!parsed) {
    throw new Error(`Invalid SemVer format: ${version}`);
  }
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

/**
 * Compare two SemVer versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareSemVer(v1: string, v2: string): number {
  const p1 = parseSemVer(v1);
  const p2 = parseSemVer(v2);
  
  if (!p1 || !p2) {
    throw new Error('Invalid SemVer format');
  }
  
  if (p1.major !== p2.major) return p1.major - p2.major;
  if (p1.minor !== p2.minor) return p1.minor - p2.minor;
  return p1.patch - p2.patch;
}

/**
 * GameVersion Repository for CRUD operations
 */
export class GameVersionRepository {
  private collection: Collection<GameVersion>;

  constructor(db: Db) {
    this.collection = db.collection<GameVersion>('game_versions');
  }

  /**
   * Get a GameVersionRepository instance
   */
  static async getInstance(): Promise<GameVersionRepository> {
    const { db } = await getMongoClient();
    return new GameVersionRepository(db);
  }

  /**
   * Find a version by ID (MongoDB _id)
   */
  async findById(id: string): Promise<GameVersion | null> {
    try {
      return this.collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  /**
   * Find all versions for a game (excluding deleted)
   */
  async findByGameId(gameId: string): Promise<GameVersion[]> {
    try {
      return this.collection
        .find({ gameId: new ObjectId(gameId), isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();
    } catch {
      return [];
    }
  }

  /**
   * Find all versions for a game (including deleted)
   */
  async findByGameIdIncludeDeleted(gameId: string): Promise<GameVersion[]> {
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
   * Find a specific version by game ID and version string
   */
  async findByVersion(gameId: string, version: string): Promise<GameVersion | null> {
    try {
      return this.collection.findOne({
        gameId: new ObjectId(gameId),
        version
      });
    } catch {
      return null;
    }
  }

  /**
   * Find versions by status (excluding deleted)
   */
  async findByStatus(status: VersionStatus): Promise<GameVersion[]> {
    return this.collection.find({ status, isDeleted: { $ne: true } }).toArray();
  }

  /**
   * Soft delete a version (prevents hard deletion to maintain audit trail)
   * Note: Versions cannot be hard deleted to preserve history
   */
  async softDelete(id: string): Promise<GameVersion | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { isDeleted: true, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Restore a soft-deleted version
   */
  async restore(id: string): Promise<GameVersion | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { isDeleted: false, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Get the latest version for a game
   */
  async getLatestVersion(gameId: string): Promise<GameVersion | null> {
    try {
      const versions = await this.findByGameId(gameId);
      if (versions.length === 0) return null;
      
      // Sort by SemVer
      versions.sort((a, b) => compareSemVer(b.version, a.version));
      return versions[0];
    } catch {
      return null;
    }
  }

  /**
   * Calculate the next version number for a game
   */
  async getNextVersion(gameId: string): Promise<string> {
    const latest = await this.getLatestVersion(gameId);
    
    if (!latest) {
      return '1.0.0'; // First version
    }
    
    return incrementPatchVersion(latest.version);
  }

  /**
   * Create a new game version with validation
   */
  async create(input: Partial<CreateGameVersionInput>): Promise<GameVersion> {
    // Validate required fields
    if (!input.gameId) {
      throw new Error('gameId is required');
    }
    if (!input.version || input.version.trim() === '') {
      throw new Error('version is required and cannot be empty');
    }
    if (!input.storagePath || input.storagePath.trim() === '') {
      throw new Error('storagePath is required and cannot be empty');
    }
    if (!input.entryFile || input.entryFile.trim() === '') {
      throw new Error('entryFile is required and cannot be empty');
    }
    if (!input.submittedBy) {
      throw new Error('submittedBy is required');
    }

    // Validate version format
    if (!isValidSemVer(input.version)) {
      throw new Error(`Invalid version format. Must be SemVer (X.Y.Z): ${input.version}`);
    }

    // Check version uniqueness
    const existing = await this.findByVersion(
      input.gameId.toString(),
      input.version
    );
    if (existing) {
      throw new Error(`Version ${input.version} already exists for this game`);
    }

    // Validate status if provided
    const status = input.status || 'draft'; // Default status is 'draft'
    if (!isValidVersionStatus(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_VERSION_STATUSES.join(', ')}`);
    }

    const now = new Date();
    const version: Omit<GameVersion, '_id'> = {
      gameId: input.gameId,
      version: input.version.trim(),
      storagePath: input.storagePath.trim(),
      entryFile: input.entryFile.trim(),
      buildSize: input.buildSize,
      status,
      isDeleted: false,
      selfQAChecklist: input.selfQAChecklist,
      releaseNote: input.releaseNote,
      submittedBy: input.submittedBy,
      submittedAt: input.submittedAt,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(version as GameVersion);
    return { ...version, _id: result.insertedId } as GameVersion;
  }

  /**
   * Update version status
   */
  async updateStatus(id: string, status: VersionStatus): Promise<GameVersion | null> {
    if (!isValidVersionStatus(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_VERSION_STATUSES.join(', ')}`);
    }

    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update Self-QA checklist
   */
  async updateSelfQA(
    id: string,
    checklist: SelfQAChecklist
  ): Promise<GameVersion | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { selfQAChecklist: checklist, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update release note
   */
  async updateReleaseNote(
    id: string,
    releaseNote: string
  ): Promise<GameVersion | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { releaseNote, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Set submittedAt timestamp when version is submitted to QC
   */
  async setSubmittedAt(id: string): Promise<GameVersion | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { submittedAt: new Date(), updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Ensure indexes are created
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ gameId: 1 });
    await this.collection.createIndex({ gameId: 1, version: 1 }, { unique: true });
    await this.collection.createIndex({ status: 1 });
    await this.collection.createIndex({ submittedAt: -1 });
  }
}
