/**
 * Game Feature Types
 * TypeScript interfaces for Game management
 */

import type { GameStatus } from "@/models/Game";
import type { VersionStatus } from "@/models/GameVersion";

/**
 * Game entity - client-side representation
 */
export interface Game {
  _id: string;
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
  priority?: "low" | "medium" | "high";
  tags?: string[];
  lesson?: string[];
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  quyenSach?: string;
  disabled: boolean;
  rolloutPercentage: number;
  publishedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Version info from API
  latestVersion?: GameVersionSummary;
  liveVersion?: GameVersionSummary;
}

export interface GameVersionSummary {
  _id: string;
  version: string;
  status: VersionStatus;
  submittedAt?: string;
}

/**
 * Response from GET /api/games/list
 */
export interface GamesListResponse {
  games: Game[];
}

/**
 * Response from GET /api/games/:id
 */
export interface GameDetailResponse {
  game: Game;
  latestVersion: GameVersion | null;
  liveVersion: GameVersion | null;
}

/**
 * Game Version entity
 */
export interface GameVersion {
  _id: string;
  gameId: string;
  version: string;
  status: VersionStatus;
  releaseNote?: string;
  entryPoint?: string;
  cdnUrl?: string;
  gcsPath?: string;
  fileSize?: number;
  validationResult?: unknown;
  selfQAChecklist?: SelfQAItem[];
  submittedBy?: string;
  submittedAt?: Date;
  testedBy?: string;
  testedAt?: Date;
  testNote?: string;
  approvedBy?: string;
  approvedAt?: Date;
  publishedBy?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SelfQAItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: string;
}

/**
 * Response from single game operations
 */
export interface GameResponse {
  success: boolean;
  game: Game;
  message?: string;
}

/**
 * Payload for updating an existing game
 */
export interface UpdateGamePayload {
  title?: string;
  description?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  lesson?: string[];
  level?: string;
  skills?: string[];
  themes?: string[];
  linkGithub?: string;
  quyenSach?: string;
}

/**
 * UI Filter state for games list
 */
export interface GameFilters {
  search: string;
  status: GameStatus | "all";
  ownerId: string | "all";
  subject: string | "all";
  grade: string | "all";
  isDeleted: boolean;
}

/**
 * Modal state for game operations
 */
export interface GameModalState {
  isOpen: boolean;
  mode: "view" | "edit" | "upload" | "qc";
  selectedGame: Game | null;
}
