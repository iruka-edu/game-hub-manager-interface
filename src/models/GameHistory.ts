import { ObjectId, type Collection, type Db } from 'mongodb';
import { getMongoClient } from '../lib/mongodb';
import type { GameStatus } from './Game';

/**
 * Game history entry interface
 */
export interface GameHistoryEntry {
  _id: ObjectId;
  gameId: string;
  action: string;
  actorId: string;
  actorEmail: string;
  oldStatus?: GameStatus;
  newStatus?: GameStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Input for creating a history entry
 */
export type CreateHistoryInput = Omit<GameHistoryEntry, '_id' | 'createdAt'>;

/**
 * Game History Repository
 */
export class GameHistoryRepository {
  private collection: Collection<GameHistoryEntry>;

  constructor(db: Db) {
    this.collection = db.collection<GameHistoryEntry>('game_history');
  }

  static async getInstance(): Promise<GameHistoryRepository> {
    const { db } = await getMongoClient();
    return new GameHistoryRepository(db);
  }

  /**
   * Add a history entry
   */
  async addEntry(input: CreateHistoryInput): Promise<GameHistoryEntry> {
    const entry: Omit<GameHistoryEntry, '_id'> = {
      ...input,
      createdAt: new Date(),
    };

    const result = await this.collection.insertOne(entry as GameHistoryEntry);
    return { ...entry, _id: result.insertedId } as GameHistoryEntry;
  }

  /**
   * Get history for a game
   */
  async getHistory(gameId: string): Promise<GameHistoryEntry[]> {
    return this.collection.find({ gameId }).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Ensure indexes
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ gameId: 1, createdAt: -1 });
  }
}
