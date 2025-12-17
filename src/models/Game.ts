import { ObjectId, type Collection, type Db } from 'mongodb';
import { getMongoClient } from '../lib/mongodb';

/**
 * Game status in the workflow
 */
export type GameStatus = 
  | 'draft' 
  | 'uploaded' 
  | 'qc_passed' 
  | 'qc_failed' 
  | 'approved' 
  | 'published' 
  | 'archived';

/**
 * Valid game statuses for validation
 */
export const VALID_GAME_STATUSES: GameStatus[] = [
  'draft', 
  'uploaded', 
  'qc_passed', 
  'qc_failed', 
  'approved', 
  'published', 
  'archived'
];

/**
 * Game interface representing a game document in MongoDB
 */
export interface Game {
  _id: ObjectId;
  gameId: string;        // e.g., "com.iruka.math"
  title: string;
  ownerId: string;       // User._id
  teamId?: string;
  status: GameStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new game
 */
export type CreateGameInput = Omit<Game, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Validate that a status is valid
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
    ownerId: game.ownerId,
    teamId: game.teamId,
    status: game.status,
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
    ownerId: data.ownerId as string,
    teamId: data.teamId as string | undefined,
    status: data.status as GameStatus,
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
    this.collection = db.collection<Game>('games');
  }

  /**
   * Get a GameRepository instance
   */
  static async getInstance(): Promise<GameRepository> {
    const { db } = await getMongoClient();
    return new GameRepository(db);
  }

  /**
   * Find a game by ID
   */
  async findById(id: string): Promise<Game | null> {
    try {
      return this.collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  /**
   * Find games by owner ID
   */
  async findByOwnerId(ownerId: string): Promise<Game[]> {
    return this.collection.find({ ownerId, isDeleted: false }).toArray();
  }

  /**
   * Find games by status
   */
  async findByStatus(status: GameStatus): Promise<Game[]> {
    return this.collection.find({ status, isDeleted: false }).toArray();
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
    if (!input.gameId || input.gameId.trim() === '') {
      throw new Error('gameId is required and cannot be empty');
    }
    if (!input.ownerId || input.ownerId.trim() === '') {
      throw new Error('ownerId is required and cannot be empty');
    }

    // Check gameId uniqueness
    const existing = await this.collection.findOne({ gameId: input.gameId });
    if (existing) {
      throw new Error('Game with this gameId already exists');
    }

    // Validate status if provided
    const status = input.status || 'draft'; // Default status is 'draft'
    if (!isValidGameStatus(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_GAME_STATUSES.join(', ')}`);
    }

    const now = new Date();
    const game: Omit<Game, '_id'> = {
      gameId: input.gameId.trim(),
      title: input.title || '',
      ownerId: input.ownerId.trim(),
      teamId: input.teamId,
      status,
      isDeleted: input.isDeleted ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(game as Game);
    return { ...game, _id: result.insertedId } as Game;
  }

  /**
   * Update game status
   */
  async updateStatus(id: string, status: GameStatus): Promise<Game | null> {
    if (!isValidGameStatus(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_GAME_STATUSES.join(', ')}`);
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
   * Ensure indexes are created
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ gameId: 1 }, { unique: true });
    await this.collection.createIndex({ ownerId: 1 });
    await this.collection.createIndex({ status: 1 });
  }
}
