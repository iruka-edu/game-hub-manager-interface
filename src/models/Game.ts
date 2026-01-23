import type { GameMetadata } from "../lib/metadata-types";

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
 * Game interface representing a game document
 */
export interface Game {
  _id: string;
  backendGameId?: string;
  gameId: string;
  title: string;
  description?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  status?: GameStatus;
  ownerId: string;
  teamId?: string;

  latestVersionId?: string;
  liveVersionId?: string;

  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  priority?: GamePriority;
  tags?: string[];
  lesson?: string[];
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  quyenSach?: string;

  disabled: boolean;
  rolloutPercentage: number;
  publishedAt?: Date;

  gcsPath?: string;

  metadata?: GameMetadata;
  metadataCompleteness?: number;
  lastMetadataUpdate?: Date;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: DeleteReason;

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
