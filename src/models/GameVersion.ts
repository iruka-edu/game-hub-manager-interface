/**
 * Version status in the workflow
 */
export type VersionStatus =
  | "draft"
  | "uploaded"
  | "qc_processing"
  | "qc_passed"
  | "qc_failed"
  | "approved"
  | "published"
  | "archived";

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
  qa01?: QA01Result;
  qa02?: QA02Result;
  qa03?: QA03Result;
  qa04?: QA04Result;
}

/**
 * GameVersion interface representing a specific build version
 */
export interface GameVersion {
  _id: string;
  gameId: string;
  version: string;

  storagePath: string;
  entryFile: string;
  entryUrl?: string;
  buildSize?: number;
  filesCount?: number;

  status: VersionStatus;
  isDeleted: boolean;

  selfQAChecklist?: SelfQAChecklist;
  releaseNote?: string;

  qaSummary?: QASummary;

  submittedBy: string;
  submittedAt?: Date;

  lastCodeUpdateAt?: Date;
  lastCodeUpdateBy?: string;

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
