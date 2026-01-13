import { ObjectId, type Collection, type Db } from "mongodb";
import { getMongoClient } from "../lib/mongodb";

/**
 * Version status in the workflow
 */
export type VersionStatus =
  | "draft" // Dev is working on it
  | "uploaded" // Submitted to QC, waiting
  | "qc_processing" // QC is actively testing
  | "qc_passed" // QC approved
  | "qc_failed" // QC rejected
  | "approved" // CTO/Admin approved
  | "published" // Live for users
  | "archived"; // Removed from public, preserved in DB

/**
 * Valid version statuses for validation
 */
export const VALID_VERSION_STATUSES: VersionStatus[] = [
  "draft",
  "uploaded",
  "qc_processing",
  "qc_passed",
  "qc_failed",
  "approved",
  "published",
  "archived",
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
 * QA-01 Handshake test results
 */
export interface QA01Result {
  pass: boolean;
  initToReadyMs?: number;
  quitToCompleteMs?: number;
}

/**
 * QA-02 Converter test results
 */
export interface QA02Result {
  pass: boolean;
  accuracy?: number;
  completion?: number;
  normalizedResult?: object;
}

/**
 * QA-03 iOS Pack test results
 */
export interface QA03Result {
  auto: {
    assetError: boolean;
    readyMs: number;
  };
  manual: {
    noAutoplay: boolean;
    noWhiteScreen: boolean;
    gestureOk: boolean;
  };
}

/**
 * QA-04 Idempotency test results
 */
export interface QA04Result {
  pass: boolean;
  duplicateAttemptId?: boolean;
  backendRecordCount?: number;
}

/**
 * QA Test Result item
 */
export interface QATestResultItem {
  id: string;
  name: string;
  passed: boolean | null;
  notes: string;
  isAutoTest?: boolean;
}

/**
 * QA Category Result
 */
export interface QACategoryResult {
  name: string;
  tests: QATestResultItem[];
}

/**
 * QA Summary structure for quick overview
 */
export interface QASummary {
  overall: "pass" | "fail";
  categories?: Record<string, QACategoryResult>;

  // Legacy fields for backward compatibility
  qa01?: QA01Result;
  qa02?: QA02Result;
  qa03?: QA03Result;
  qa04?: QA04Result;
}

/**
 * GameVersion interface representing a specific build version
 */
export interface GameVersion {
  _id: ObjectId;
  gameId: ObjectId; // Reference to Game
  version: string; // SemVer (e.g., "1.0.1")

  // Storage
  storagePath: string; // "games/{slug}/{version}/"
  entryFile: string; // "index.html"
  entryUrl?: string; // Full URL to entry file (for web games)
  buildSize?: number; // Bytes
  filesCount?: number; // Number of files in the build

  // Status
  status: VersionStatus;
  isDeleted: boolean; // Soft delete flag

  // Self-QA
  selfQAChecklist?: SelfQAChecklist;
  releaseNote?: string; // What changed in this version

  // QC Testing Summary
  qaSummary?: QASummary;

  // Submission
  submittedBy: ObjectId; // User._id
  submittedAt?: Date;

  // Code Update Tracking
  lastCodeUpdateAt?: Date; // Last time code files were updated/replaced
  lastCodeUpdateBy?: ObjectId; // User who last updated the code

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new GameVersion
 */
export type CreateGameVersionInput = Omit<
  GameVersion,
  "_id" | "createdAt" | "updatedAt"
>;

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
export function parseSemVer(
  version: string
): { major: number; minor: number; patch: number } | null {
  if (!isValidSemVer(version)) {
    return null;
  }
  const parts = version.split(".").map(Number);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
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
    throw new Error("Invalid SemVer format");
  }

  if (p1.major !== p2.major) return p1.major - p2.major;
  if (p1.minor !== p2.minor) return p1.minor - p2.minor;
  return p1.patch - p2.patch;
}

/**
 * Serialize a GameVersion to JSON-safe object
 */
export function serializeGameVersion(
  version: GameVersion
): Record<string, unknown> {
  return {
    _id: version._id.toString(),
    gameId: version.gameId.toString(),
    version: version.version,
    storagePath: version.storagePath,
    entryFile: version.entryFile,
    entryUrl: version.entryUrl,
    buildSize: version.buildSize,
    filesCount: version.filesCount,
    status: version.status,
    isDeleted: version.isDeleted,
    selfQAChecklist: version.selfQAChecklist,
    releaseNote: version.releaseNote,
    qaSummary: version.qaSummary,
    submittedBy: version.submittedBy.toString(),
    submittedAt: version.submittedAt?.toISOString(),
    lastCodeUpdateAt: version.lastCodeUpdateAt?.toISOString(),
    lastCodeUpdateBy: version.lastCodeUpdateBy?.toString(),
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };
}

/**
 * Deserialize a JSON object back to a GameVersion
 */
export function deserializeGameVersion(
  data: Record<string, unknown>
): GameVersion {
  return {
    _id: new ObjectId(data._id as string),
    gameId: new ObjectId(data.gameId as string),
    version: data.version as string,
    storagePath: data.storagePath as string,
    entryFile: data.entryFile as string,
    entryUrl: data.entryUrl as string | undefined,
    buildSize: data.buildSize as number | undefined,
    filesCount: data.filesCount as number | undefined,
    status: data.status as VersionStatus,
    isDeleted: (data.isDeleted as boolean) ?? false,
    selfQAChecklist: data.selfQAChecklist as SelfQAChecklist | undefined,
    releaseNote: data.releaseNote as string | undefined,
    qaSummary: data.qaSummary as QASummary | undefined,
    submittedBy: new ObjectId(data.submittedBy as string),
    submittedAt: data.submittedAt
      ? new Date(data.submittedAt as string)
      : undefined,
    lastCodeUpdateAt: data.lastCodeUpdateAt
      ? new Date(data.lastCodeUpdateAt as string)
      : undefined,
    lastCodeUpdateBy: data.lastCodeUpdateBy
      ? new ObjectId(data.lastCodeUpdateBy as string)
      : undefined,
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
  };
}

/**
 * GameVersion Repository for CRUD operations
 */
export class GameVersionRepository {
  private collection: Collection<GameVersion>;

  constructor(db: Db) {
    this.collection = db.collection<GameVersion>("game_versions");
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
      // Validate ObjectId format
      if (!ObjectId.isValid(gameId)) {
        console.warn(`Invalid ObjectId format for gameId: ${gameId}`);
        return [];
      }

      const result = await this.collection
        .find({ gameId: new ObjectId(gameId), isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();

      return result;
    } catch (error) {
      console.error(`Error finding versions for gameId ${gameId}:`, error);
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
  async findByVersion(
    gameId: string,
    version: string
  ): Promise<GameVersion | null> {
    try {
      return this.collection.findOne({
        gameId: new ObjectId(gameId),
        version,
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
        { returnDocument: "after" }
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
        { returnDocument: "after" }
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
      return "1.0.0"; // First version
    }

    return incrementPatchVersion(latest.version);
  }

  /**
   * Create a new game version with validation
   */
  async create(input: Partial<CreateGameVersionInput>): Promise<GameVersion> {
    // Validate required fields
    if (!input.gameId) {
      throw new Error("gameId is required");
    }
    if (!input.version || input.version.trim() === "") {
      throw new Error("version is required and cannot be empty");
    }
    if (!input.storagePath || input.storagePath.trim() === "") {
      throw new Error("storagePath is required and cannot be empty");
    }
    if (!input.entryFile || input.entryFile.trim() === "") {
      throw new Error("entryFile is required and cannot be empty");
    }
    if (!input.submittedBy) {
      throw new Error("submittedBy is required");
    }

    // Validate version format
    if (!isValidSemVer(input.version)) {
      throw new Error(
        `Invalid version format. Must be SemVer (X.Y.Z): ${input.version}`
      );
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
    const status = input.status || "draft"; // Default status is 'draft'
    if (!isValidVersionStatus(status)) {
      throw new Error(
        `Invalid status. Must be one of: ${VALID_VERSION_STATUSES.join(", ")}`
      );
    }

    const now = new Date();
    const version: Omit<GameVersion, "_id"> = {
      gameId: input.gameId,
      version: input.version.trim(),
      storagePath: input.storagePath.trim(),
      entryFile: input.entryFile.trim(),
      entryUrl: input.entryUrl,
      buildSize: input.buildSize,
      filesCount: input.filesCount,
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
   * Patch an existing build (overwrite)
   * Logic:
   * - If version was never published (draft, uploaded, qc_processing, qc_failed, qc_passed, approved): Keep current status
   * - If version was published: Reset to draft (must re-test from beginning)
   * Always clears Self-QA checklist and records update timestamp
   */
  async patchBuild(
    id: string,
    buildSize: number,
    updatedBy: ObjectId
  ): Promise<GameVersion | null> {
    try {
      // First, get current version to check status
      const currentVersion = await this.findById(id);
      if (!currentVersion) {
        return null;
      }

      // Determine new status based on current status
      let newStatus = currentVersion.status;

      // If version was published, reset to draft (must re-test)
      if (currentVersion.status === "published") {
        newStatus = "draft";
      }
      // Otherwise, keep current status (draft, uploaded, qc_processing, qc_failed, qc_passed, approved)

      const now = new Date();
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            buildSize,
            status: newStatus,
            selfQAChecklist: {
              testedDevices: false,
              testedAudio: false,
              gameplayComplete: false,
              contentVerified: false,
              note:
                currentVersion.status === "published"
                  ? "Bản build đã được cập nhật. Game đã publish nên phải test lại từ đầu."
                  : "Bản build đã được cập nhật (Patch)",
            },
            lastCodeUpdateAt: now,
            lastCodeUpdateBy: updatedBy,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Generic update method for updating multiple fields at once
   */
  async update(
    id: string,
    updates: Partial<Omit<GameVersion, "_id" | "gameId" | "createdAt">>
  ): Promise<GameVersion | null> {
    try {
      // Validate status if it's being updated
      if (updates.status && !isValidVersionStatus(updates.status)) {
        throw new Error(
          `Invalid status. Must be one of: ${VALID_VERSION_STATUSES.join(", ")}`
        );
      }

      // Ensure updatedAt is always set
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update version status
   */
  async updateStatus(
    id: string,
    status: VersionStatus
  ): Promise<GameVersion | null> {
    if (!isValidVersionStatus(status)) {
      throw new Error(
        `Invalid status. Must be one of: ${VALID_VERSION_STATUSES.join(", ")}`
      );
    }

    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: "after" }
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
        { returnDocument: "after" }
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
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update QA summary after QC testing
   */
  async updateQASummary(
    id: string,
    qaSummary: QASummary
  ): Promise<GameVersion | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { qaSummary, updatedAt: new Date() } },
        { returnDocument: "after" }
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
        { returnDocument: "after" }
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
    await this.collection.createIndex(
      { gameId: 1, version: 1 },
      { unique: true }
    );
    await this.collection.createIndex({ status: 1 });
    await this.collection.createIndex({ submittedAt: -1 });
  }
}
