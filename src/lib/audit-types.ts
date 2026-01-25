/**
 * Types of actions that can be logged in the audit system
 */
export type ActionType =
  | "CREATE_GAME"
  | "UPDATE_GAME"
  | "CHANGE_STATUS"
  | "QC_ISSUE"
  | "REVIEW_DECISION"
  | "PUBLISH_ACTION"
  | "USER_ROLE_CHANGE"
  | "USER_STATE_CHANGE"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "GAME_UPLOAD"
  | "GAME_UPDATE_METADATA"
  | "GAME_APPROVE"
  | "GAME_REJECT"
  | "GAME_PUBLISH"
  | "GAME_QC_PASS"
  | "GAME_QC_FAIL";

/**
 * Entity types that can be targeted by actions
 */
export type TargetEntity =
  | "GAME"
  | "GAME_VERSION"
  | "USER"
  | "ISSUE"
  | "SYSTEM";

/**
 * Information about the user who performed the action
 */
export interface AuditActor {
  userId: string;
  email: string;
  role: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Information about the target of the action
 */
export interface AuditTarget {
  entity: TargetEntity;
  id: string;
  subId?: string;
}

/**
 * Represents a single field change
 */
export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Complete audit log entry stored in the audit system
 */
export interface AuditLogEntry {
  _id?: string;
  actor: AuditActor;
  action: ActionType;
  target: AuditTarget;
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilter {
  userId?: string;
  action?: ActionType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}
