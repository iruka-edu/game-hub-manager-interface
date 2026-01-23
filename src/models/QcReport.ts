import type {
  QA01Result,
  QA02Result,
  QA03Result,
  QA04Result,
  QASummary,
} from "./GameVersion";

/**
 * Game event types captured during testing
 */
export type GameEventType =
  | "INIT"
  | "READY"
  | "RESULT"
  | "QUIT"
  | "COMPLETE"
  | "ERROR";

/**
 * Individual game event in the timeline
 */
export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  data?: unknown;
}

/**
 * QC decision types
 */
export type QCDecision = "pass" | "fail";

/**
 * Comprehensive QC Report interface
 */
export interface QCReport {
  _id: string;
  gameId: string;
  versionId: string;
  qcUserId: string;
  reviewerName?: string;

  qa01?: QA01Result;
  qa02?: QA02Result;
  qa03?: QA03Result;
  qa04?: QA04Result;

  qaSummary?: QASummary;

  rawResult?: object;
  eventsTimeline?: GameEvent[];

  decision: QCDecision;
  notes?: string;

  reviewedAt?: Date;
  testStartedAt?: Date;
  testCompletedAt?: Date;
  createdAt: Date;
}

/**
 * Input type for creating a new QC Report
 */
export type CreateQCReportInput = Omit<QCReport, "_id" | "createdAt">;
