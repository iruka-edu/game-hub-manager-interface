import { ObjectId, type Collection, type Db } from "mongodb";
import { getMongoClient } from "../lib/mongodb";

/**
 * @deprecated Game status is now in GameVersion model. Use VersionStatus instead.
 * Kept for backward compatibility during migration.
 */
export type GameStatus =
  | "draft"
  | "uploaded"
  | "qc_passed"
  | "qc_failed"
  | "approved"
  | "published"
  | "archived";

/**
 * @deprecated Valid game statuses for validation. Use VALID_VERSION_STATUSES instead.
 */
export const VALID_GAME_STATUSES: GameStatus[] = [
  "draft",
  "uploaded",
  "qc_passed",
  "qc_failed",
  "approved",
  "published",
  "archived",
];

/**
 * Priority levels for games
 */
export type GamePriority = "low" | "medium" | "high";

/**
 * Deletion reasons for audit trail
 */
export type DeleteReason =
  | "dev_draft_deleted"
  | "admin_soft_delete"
  | "admin_hard_delete"
  | "system_cleanup"
  | "obsolete_test_game"
  | "compliance_removal"
  | "user_request";

/**
 * @deprecated Self-QA is now in GameVersion model. Use SelfQAChecklist instead.
 */
export interface SelfQaItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: Date;
}

/**
 * Game interface representing a game document in MongoDB
 */
export interface Game {
  _id: ObjectId;
  gameId: string; // e.g., "com.iruka.math" (also used as slug)
  title: string;
  description?: string;
  status?: GameStatus; // @deprecated: use version status instead, but keep for RBAC compat
  ownerId: string; // User._id
  teamId?: string;

  // Version references
  latestVersionId?: ObjectId; // Most recent GameVersion
  liveVersionId?: ObjectId; // Currently published version for users

  // Metadata
  subject?: string; // Môn học
  grade?: string; // Lớp
  unit?: string; // Unit SGK
  gameType?: string; // Loại game
  priority?: GamePriority;
  tags?: string[];

  // Publishing fields
  disabled: boolean; // Kill-switch: if true, game is hidden from Public Registry
  rolloutPercentage: number; // 0-100, percentage of users who can see this game
  publishedAt?: Date; // When the game was first published

  // Storage path for GCS cleanup
  gcsPath?: string; // e.g., "games/com.iruka.math/"

  // Deletion metadata (3-level deletion system)
  isDeleted: boolean; // Soft delete flag
  deletedAt?: Date; // When the game was soft deleted
  deletedBy?: string; // User ID who deleted the game
  deleteReason?: DeleteReason; // Reason for deletion

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new game
 */
export type CreateGameInput = Omit<Game, "_id" | "createdAt" | "updatedAt">;

/**
 * @deprecated Use isValidVersionStatus from GameVersion model instead.
 */
export function isValidGameStatus(status: string): status is GameStatus {
  return VALID_GAME_STATUSES.includes(status as GameStatus);
}

/**
 * Serialize a Game to JSON-safe object
 */
export function serializeGame(game: Game): Record<string, unknown> {
  return {
    _id: game._id.toString(),
    gameId: game.gameId,
    title: game.title,
    description: game.description,
    ownerId: game.ownerId,
    teamId: game.teamId,
    latestVersionId: game.latestVersionId?.toString(),
    liveVersionId: game.liveVersionId?.toString(),
    subject: game.subject,
    grade: game.grade,
    unit: game.unit,
    gameType: game.gameType,
    priority: game.priority,
    tags: game.tags,
    disabled: game.disabled,
    rolloutPercentage: game.rolloutPercentage,
    publishedAt: game.publishedAt?.toISOString(),
    isDeleted: game.isDeleted,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

/**
 * Deserialize a JSON object back to a Game
 */
export function deserializeGame(data: Record<string, unknown>): Game {
  return {
    _id: new ObjectId(data._id as string),
    gameId: data.gameId as string,
    title: data.title as string,
    description: data.description as string | undefined,
    ownerId: data.ownerId as string,
    teamId: data.teamId as string | undefined,
    latestVersionId: data.latestVersionId
      ? new ObjectId(data.latestVersionId as string)
      : undefined,
    liveVersionId: data.liveVersionId
      ? new ObjectId(data.liveVersionId as string)
      : undefined,
    subject: data.subject as string | undefined,
    grade: data.grade as string | undefined,
    unit: data.unit as string | undefined,
    gameType: data.gameType as string | undefined,
    priority: data.priority as GamePriority | undefined,
    tags: data.tags as string[] | undefined,
    disabled: (data.disabled as boolean) ?? false,
    rolloutPercentage: (data.rolloutPercentage as number) ?? 100,
    publishedAt: data.publishedAt
      ? new Date(data.publishedAt as string)
      : undefined,
    isDeleted: data.isDeleted as boolean,
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
  };
}

/**
 * Game Repository for CRUD operations
 */
export class GameRepository {
  private collection: Collection<Game>;

  constructor(db: Db) {
    this.collection = db.collection<Game>("games");
  }

  /**
   * Get a GameRepository instance
   */
  static async getInstance(): Promise<GameRepository> {
    const { db } = await getMongoClient();
    return new GameRepository(db);
  }

  /**
   * Find a game by ID (MongoDB _id)
   */
  async findById(id: string): Promise<Game | null> {
    try {
      return this.collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  /**
   * Find a game by gameId (e.g., "com.iruka.math")
   */
  async findByGameId(gameId: string): Promise<Game | null> {
    return this.collection.findOne({ gameId, isDeleted: false });
  }

  /**
   * Find games by owner ID
   */
  async findByOwnerId(ownerId: string): Promise<Game[]> {
    return this.collection.find({ ownerId, isDeleted: false }).toArray();
  }

  /**
   * Find all games (excluding deleted)
   */
  async findAll(): Promise<Game[]> {
    return this.collection.find({ isDeleted: false }).toArray();
  }

  /**
   * Create a new game with validation
   */
  async create(input: Partial<CreateGameInput>): Promise<Game> {
    // Validate required fields
    if (!input.gameId || input.gameId.trim() === "") {
      throw new Error("gameId is required and cannot be empty");
    }
    if (!input.ownerId || input.ownerId.trim() === "") {
      throw new Error("ownerId is required and cannot be empty");
    }

    // Check gameId uniqueness
    const existing = await this.collection.findOne({ gameId: input.gameId });
    if (existing) {
      throw new Error("Game with this gameId already exists");
    }

    const now = new Date();
    const game: Omit<Game, "_id"> = {
      gameId: input.gameId.trim(),
      title: input.title || "",
      description: input.description,
      ownerId: input.ownerId.trim(),
      teamId: input.teamId,
      latestVersionId: input.latestVersionId,
      liveVersionId: input.liveVersionId,
      subject: input.subject,
      grade: input.grade,
      unit: input.unit,
      gameType: input.gameType,
      priority: input.priority,
      tags: input.tags,
      disabled: input.disabled ?? false,
      rolloutPercentage: input.rolloutPercentage ?? 100,
      publishedAt: input.publishedAt,
      isDeleted: input.isDeleted ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(game as Game);
    return { ...game, _id: result.insertedId } as Game;
  }

  /**
   * Soft delete a game
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isDeleted: true, updatedAt: new Date() } }
      );
      return result.modifiedCount === 1;
    } catch {
      return false;
    }
  }

  /**
   * Update game metadata
   */
  async updateMetadata(
    id: string,
    data: Partial<
      Pick<
        Game,
        | "title"
        | "description"
        | "subject"
        | "grade"
        | "unit"
        | "gameType"
        | "priority"
        | "tags"
        | "rolloutPercentage"
        | "disabled"
      >
    >
  ): Promise<Game | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update game status (legacy)
   */
  async updateStatus(id: string, status: GameStatus): Promise<Game | null> {
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
   * Update latest version reference
   */
  async updateLatestVersion(
    id: string,
    versionId: ObjectId
  ): Promise<Game | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { latestVersionId: versionId, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update live version reference
   */
  async updateLiveVersion(
    id: string,
    versionId: ObjectId
  ): Promise<Game | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { liveVersionId: versionId, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update disabled flag (kill-switch)
   * @param id - Game ID
   * @param disabled - Whether the game should be disabled
   * @returns Updated game or null if not found
   */
  async updateDisabled(id: string, disabled: boolean): Promise<Game | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { disabled, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update rollout percentage
   * @param id - Game ID
   * @param percentage - Rollout percentage (0-100)
   * @returns Updated game or null if not found
   * @throws Error if percentage is out of range
   */
  async updateRolloutPercentage(
    id: string,
    percentage: number
  ): Promise<Game | null> {
    // Validate percentage range
    if (percentage < 0 || percentage > 100) {
      throw new Error("Rollout percentage must be between 0 and 100");
    }
    if (!Number.isInteger(percentage)) {
      throw new Error("Rollout percentage must be an integer");
    }

    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { rolloutPercentage: percentage, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Set publishedAt timestamp when game is first published
   * @param id - Game ID
   * @returns Updated game or null if not found
   */
  async setPublishedAt(id: string): Promise<Game | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id), publishedAt: { $exists: false } },
        { $set: { publishedAt: new Date(), updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Find all published and enabled games (for Public Registry)
   *
   * Filtering criteria:
   * - isDeleted: false (not soft deleted)
   * - disabled: not true (kill-switch not activated)
   * - liveVersionId: exists (has a live version set)
   *
   * Note: This method does NOT verify that the live version is 'published'.
   * That verification happens in PublicRegistryManager.buildPublicEntry()
   * to avoid complex joins at the database level.
   *
   * @returns Array of games that meet the basic criteria for public visibility
   */
  async findPublishedAndEnabled(): Promise<Game[]> {
    return this.collection
      .find({
        isDeleted: false,
        disabled: { $ne: true }, // Exclude disabled games (kill-switch)
        liveVersionId: { $exists: true }, // Must have a live version set
      } as any)
      .toArray();
  }

  /**
   * Find a game by ID including soft-deleted games
   */
  async findByIdIncludeDeleted(id: string): Promise<Game | null> {
    try {
      return this.collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  /**
   * Update game with arbitrary fields
   */
  async update(id: string, updates: Partial<Game>): Promise<Game | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Find all soft-deleted games (for trash/admin view)
   */
  async findDeleted(): Promise<Game[]> {
    return this.collection.find({ isDeleted: true }).toArray();
  }

  /**
   * Find games marked for hard deletion
   */
  async findMarkedForHardDeletion(): Promise<Game[]> {
    return this.collection
      .find({
        isDeleted: true,
        deleteReason: { $regex: /^hard_delete_requested:/ },
      })
      .toArray();
  }

  /**
   * Ensure indexes are created
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ gameId: 1 }, { unique: true });
    await this.collection.createIndex({ ownerId: 1 });
    await this.collection.createIndex({ isDeleted: 1 });
    await this.collection.createIndex({ subject: 1, grade: 1 });
    await this.collection.createIndex({ deletedAt: 1 });
    await this.collection.createIndex({ deleteReason: 1 });
  }
}
