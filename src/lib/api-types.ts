/**
 * API Response Type Definitions
 * Centralized TypeScript interfaces for all API responses
 */

import type { Game, GameStatus } from '../models/Game';
import type { GameVersion, VersionStatus } from '../models/GameVersion';
import type { User } from '../models/User';

// ============================================================================
// Version Management API Types
// ============================================================================

export interface VersionListItem {
  _id: string;
  version: string;
  status: VersionStatus;
  createdAt: string;
  submittedBy: string;
  submittedByName: string;
}

export interface VersionListResponse {
  versions: VersionListItem[];
}

export interface ActivateVersionRequest {
  gameId: string;
  versionId: string;
}

export interface ActivateVersionResponse {
  success: boolean;
  game: Game;
}

export interface DeleteVersionRequest {
  gameId: string;
  versionId: string;
}

export interface DeleteVersionResponse {
  success: boolean;
  message: string;
}

export interface CreateVersionRequest {
  gameId: string;
  version?: string;
  releaseNote?: string;
}

export interface CreateVersionResponse {
  success: boolean;
  version: GameVersion;
}

// ============================================================================
// Dashboard Statistics API Types
// ============================================================================

export interface DevDashboardStats {
  drafts: number;
  qcFailed: number;
  uploaded: number;
  published: number;
}

export interface DevDashboardResponse {
  stats: DevDashboardStats;
  recentGames: Game[];
}

export interface QCDashboardStats {
  awaitingQC: number;
  testedThisWeek: number;
  testedThisMonth: number;
  passFailRatio: {
    passed: number;
    failed: number;
  };
}

export interface QCDashboardResponse {
  stats: QCDashboardStats;
  gamesNeedingQC: Game[];
}

export interface CTODashboardStats {
  awaitingApproval: number;
  approvedThisWeek: number;
  approvedThisMonth: number;
}

export interface CTODashboardResponse {
  stats: CTODashboardStats;
  gamesAwaitingApproval: Game[];
}

export interface AdminDashboardStats {
  published: number;
  archived: number;
  awaitingPublication: number;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  gamesAwaitingPublication: Game[];
  recentlyPublished: Game[];
}

// ============================================================================
// Game Management API Types
// ============================================================================

export interface GameListRequest {
  status?: GameStatus;
  ownerId?: string;
  subject?: string;
  grade?: string;
  isDeleted?: boolean;
}

export interface GameListResponse {
  games: Game[];
}

export interface ResponsibleUser {
  _id: string;
  name: string;
  email: string;
}

export interface GameDetailResponse {
  game: Game;
  responsibleUser: ResponsibleUser | null;
  versions: GameVersion[];
}

export interface UpdateGameRequest {
  title?: string;
  description?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  gameType?: string;
  ownerId?: string;
  tags?: string[];
}

export interface UpdateGameResponse {
  success: boolean;
  game: Game;
}

export interface RequestChangeRequest {
  gameId: string;
  note: string;
}

export interface RequestChangeResponse {
  success: boolean;
  game: Game;
}

// ============================================================================
// Game History and QC Reports API Types
// ============================================================================

export interface GameHistoryEntry {
  timestamp: string;
  action: string;
  actor: string;
  actorName: string;
  oldStatus?: string;
  newStatus?: string;
  note?: string;
}

export interface GameHistoryResponse {
  history: GameHistoryEntry[];
}

export interface QCReportEntry {
  _id: string;
  versionId: string;
  version: string;
  tester: string;
  testerName: string;
  result: 'pass' | 'fail';
  note: string;
  severity?: 'low' | 'medium' | 'high';
  testedAt: string;
}

export interface QCReportsResponse {
  reports: QCReportEntry[];
}

// ============================================================================
// Filter State Types
// ============================================================================

export interface FilterState {
  status: GameStatus | 'all';
  ownerId: string | 'all';
  subject: string | 'all';
  grade: string | 'all';
}

// ============================================================================
// Common Response Types
// ============================================================================

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}
