import type { GameStatus } from "./Game";
import type { VersionStatus } from "./GameVersion";

/**
 * Game history entry interface
 */
export interface GameHistoryEntry {
  _id: string;
  gameId: string;
  action: string;
  actorId: string;
  actorEmail: string;
  oldStatus?: GameStatus | VersionStatus;
  newStatus?: GameStatus | VersionStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Input for creating a history entry
 */
export type CreateHistoryInput = Omit<GameHistoryEntry, "_id" | "createdAt">;
