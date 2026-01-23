/**
 * Game Feature Types
 * Matching BE_vu_v2.json API schemas (snake_case)
 */

/**
 * Game priority enum
 */
export type GamePriority = "high" | "medium" | "low";

/**
 * Thumbnail schema
 */
export interface ThumbnailSchema {
  desktop?: string;
  mobile?: string;
}

/**
 * Game metadata (JSONB field)
 */
export interface GameMetaData {
  status?: string;
  thumbnail?: ThumbnailSchema;
  gameType?: string;
  priority?: GamePriority;
  level?: string;
  tags?: string[];
  lesson?: string[];
  skills?: string[];
  themes?: string[];
  subject?: string;
  grade?: string;
  unit?: string;
  quyenSach?: string;
}

/**
 * Self QA checklist item
 */
export interface SelfQAItem {
  id: string;
  label: string;
  checked: boolean;
  checked_at?: string;
}

/**
 * Self QA checklist (sent to API)
 */
export interface SelfQAChecklist {
  items: SelfQAItem[];
  note?: string;
  versionId?: string;
}

/**
 * Build data for game version
 */
export interface BuildData {
  storagePath?: string | null;
  entryFile?: string;
  buildSize?: number | null;
  entryUrl?: string | null;
  extractedFiles?: string[] | null;
  filesCount?: number | null;
  selfQAChecklist?: SelfQAChecklist | null;
  releaseNote?: string | null;
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
 * QA Summary for game version
 */
export interface QASummary {
  overall?: string | null;
  total_tests?: number | null;
  passed_tests?: number | null;
  failed_tests?: number | null;
  notes?: string | null;
  tested_by?: string | null;
  tested_at?: string | null;
  categories?: Record<string, QACategoryResult>;
}

/**
 * Game list item (lightweight)
 * Matches GameListItem schema
 */
export interface GameListItem {
  id: string;
  game_id: string;
  title: string;
  description?: string | null;
  owner_id: string;
  disabled: boolean;
  live_version_id?: string | null;
  published_at?: string | null;
  created_at: string;
}

/**
 * Full game response
 * Matches GameOut / GameResponse schema
 */
export interface Game {
  id: string;
  game_id: string;
  title: string;
  description?: string | null;
  owner_id: string;
  team_id?: string | null;
  last_version_id?: string | null;
  live_version_id?: string | null;
  github_link?: string | null;
  gcs_path?: string | null;
  disabled: boolean;
  rolloutPercentage: number;
  published_at?: string | null;
  meta_data?: GameMetaData | null;
  last_meta_date_update?: string | null;
  is_deleted: boolean;
  delete_at?: string | null;
  delete_by?: string | null;
  delete_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Game version output
 * Matches GameVersionOut schema
 */
export interface GameVersion {
  id: string;
  game_id: string;
  version: string;
  status?: string | null;
  is_deleted: boolean;
  build_data?: BuildData | null;
  qc_summary?: QASummary | null;
  submitted_by?: string | null;
  submitted_at?: string | null;
  last_code_update_at?: string | null;
  last_code_update_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * UI Serialized Game Object (CamelCase for Client Components)
 */
export interface SerializedGame extends Record<string, unknown> {
  _id: string;
  gameId: string;
  title: string;
  description?: string;
  thumbnailDesktop?: string;
  thumbnailMobile?: string;
  ownerId: string;
  teamId?: string | null;
  latestVersionId?: string | null;
  liveVersionId?: string | null;
  subject?: string;
  grade?: string;
  gameType?: string;
  status: string;
  disabled?: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * UI Serialized Game Version Object
 */
export interface SerializedVersion extends Record<string, unknown> {
  _id: string;
  gameId: string;
  version: string;
  status: string;
  isDeleted: boolean;
  changelog?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Response from GET /api/v1/games/list
 */
export type GamesListResponse = GameListItem[];

/**
 * Response from GET /api/v1/games/{game_id}
 */
export type GameDetailResponse = Game;

/**
 * Response from POST /api/v1/games/create
 */
export interface GameCreateResponse {
  success?: boolean;
  game: Game;
  version: GameVersion;
}

/**
 * Payload for creating game
 * Matches GameCreateIn schema
 */
export interface CreateGamePayload {
  id?: string;
  title: string;
  gameId: string;
  description?: string | null;
  teamId?: string | null;
  githubLink?: string | null;
  gcsPath?: string | null;
  gameType?: string | null;
  priority?: string | null;
  lessonIds?: string[];
  skillIds?: string[];
  themeIds?: string[];
  levelId?: string | null;
  tags?: string[];
  version?: string;
  storagePath?: string | null;
  entryFile?: string;
  buildSize?: number | null;
  releaseNote?: string | null;
  selfQAChecklist?: SelfQAChecklist | null;
}

/**
 * Payload for updating game
 * Matches GameUpdate schema
 */
export interface UpdateGamePayload {
  title?: string | null;
  description?: string | null;
  team_id?: string | null;
  github_link?: string | null;
  gcs_path?: string | null;
  meta_data?: GameMetaData | null;
  last_meta_date_update?: string | null;
  disabled?: boolean | null;
  rolloutPercentage?: number | null;
}

/**
 * Approve/Reject payload
 * Matches ApproveIn schema
 */
export interface ApprovePayload {
  decision: "approve" | "reject";
  note?: string | null;
}

/**
 * Publish payload
 * Matches PublishIn schema
 */
export interface PublishPayload {
  note?: string | null;
}

/**
 * QC Review payload
 * Matches QcReviewIn schema
 */
export interface QCReviewPayload {
  versionId: string;
  decision: "pass" | "fail";
  qaSummary?: Record<string, any> | null;
  notes?: string | null;
  reviewerName?: string | null;
}

/**
 * Response from POST /api/games/{id}/self-qa
 */
export interface SelfQAResponse {
  success: boolean;
  versionId: string;
  buildData: BuildData;
}

/**
 * UI Filter state for games list
 * Note: status, ownerId, subject, grade are for client-side filtering
 * API only supports: skip, limit, mine, include_deleted
 */
export interface GameFilters {
  search: string;
  status: string | "all";
  ownerId: string | "all";
  subject: string | "all";
  grade: string | "all";
  includeDeleted: boolean;
  mine: boolean;
}

/**
 * Modal state for game operations
 */
export interface GameModalState {
  isOpen: boolean;
  mode: "view" | "edit" | "upload" | "qc";
  selectedGame: Game | null;
}
