import type { ObjectId } from 'mongodb';

/**
 * Types of actions that can be logged in the audit system
 */
export type ActionType =
  | 'GAME_UPLOAD'
  | 'GAME_UPDATE_METADATA'
  | 'GAME_DELETE_VERSION'
  | 'GAME_DELETE_FULL'
  | 'GAME_STATUS_CHANGE'
  | 'GAME_SET_LIVE'
  | 'GAME_DISABLE'
  | 'GAME_RESET_TO_DRAFT'
  | 'GAME_SYNC_FROM_GCS'
  | 'USER_LOGIN'
  | 'USER_LOGOUT';

/**
 * Entity types that can be targeted by actions
 */
export type TargetEntity = 'GAME' | 'GAME_VERSION' | 'USER' | 'SYSTEM';

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
 * Complete audit log entry stored in MongoDB
 */
export interface AuditLogEntry {
  _id?: ObjectId;
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
