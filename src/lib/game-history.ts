import {
  GameHistoryRepository,
  type GameHistoryEntry,
} from "../models/GameHistory";
import type { GameStatus } from "../models/Game";
import type { VersionStatus } from "../models/GameVersion";
import type { User } from "../models/User";

/**
 * Game History Service
 */
export const GameHistoryService = {
  /**
   * Add a history entry for a game
   */
  async addEntry(
    gameId: string,
    action: string,
    actor: User,
    oldStatus?: GameStatus | VersionStatus,
    newStatus?: GameStatus | VersionStatus,
    metadata?: Record<string, unknown>
  ): Promise<GameHistoryEntry> {
    const repo = await GameHistoryRepository.getInstance();
    return repo.addEntry({
      gameId,
      action,
      actorId: actor._id.toString(),
      actorEmail: actor.email,
      oldStatus,
      newStatus,
      metadata,
    });
  },

  /**
   * Record game creation
   */
  async recordCreation(gameId: string, actor: User): Promise<void> {
    await this.addEntry(gameId, "Tạo game mới", actor, undefined, "draft");
  },

  /**
   * Record game submission to QC
   */
  async recordSubmission(
    gameId: string,
    actor: User,
    oldStatus: GameStatus
  ): Promise<void> {
    await this.addEntry(gameId, "Gửi QC", actor, oldStatus, "uploaded");
  },

  /**
   * Record QC result
   */
  async recordQcResult(
    gameId: string,
    actor: User,
    result: "pass" | "fail",
    note?: string
  ): Promise<void> {
    const action = result === "pass" ? "QC đạt" : "QC cần sửa";
    const newStatus: GameStatus = result === "pass" ? "qc_passed" : "qc_failed";
    await this.addEntry(gameId, action, actor, "uploaded", newStatus, { note });
  },

  /**
   * Record game approval
   */
  async recordApproval(gameId: string, actor: User): Promise<void> {
    await this.addEntry(gameId, "Phê duyệt", actor, "qc_passed", "approved");
  },

  /**
   * Record game publication
   */
  async recordPublication(gameId: string, actor: User): Promise<void> {
    await this.addEntry(gameId, "Xuất bản", actor, "approved", "published");
  },

  /**
   * Record a status change with optional metadata or note
   */
  async recordStatusChange(
    gameId: string,
    actor: User,
    oldStatus?: GameStatus | VersionStatus,
    newStatus?: GameStatus | VersionStatus,
    metadataOrNote?: Record<string, unknown> | string
  ): Promise<void> {
    let metadata: Record<string, unknown> | undefined;
    let action = "Thay đổi trạng thái";

    if (typeof metadataOrNote === "string") {
      metadata = { note: metadataOrNote };
    } else if (metadataOrNote && typeof metadataOrNote === "object") {
      const { action: metaAction, ...rest } = metadataOrNote as Record<
        string,
        unknown
      > & { action?: string };
      if (metaAction) action = metaAction as string;
      metadata = rest;
    }

    // Default action names based on target status if not explicitly provided
    if (action === "Thay đổi trạng thái") {
      if (newStatus === "draft") action = "Tạo phiên bản";
      if (newStatus === "uploaded") action = "Gửi QC";
      if (newStatus === "qc_passed") action = "QC đạt";
      if (newStatus === "qc_failed") action = "QC không đạt";
      if (newStatus === "approved") action = "Phê duyệt";
      if (newStatus === "published") action = "Xuất bản";
    }

    await this.addEntry(gameId, action, actor, oldStatus, newStatus, metadata);
  },

  /**
   * Get history for a game
   */
  async getHistory(gameId: string): Promise<GameHistoryEntry[]> {
    const repo = await GameHistoryRepository.getInstance();
    return repo.getHistory(gameId);
  },
};
