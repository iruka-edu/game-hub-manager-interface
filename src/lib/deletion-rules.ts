import type { DeleteReason, Game } from "../models/Game";
import type { GameVersion, VersionStatus } from "../models/GameVersion";
import type { User } from "../models/User";
import { hasPermissionString } from "./auth-rbac";

/**
 * Check if a game has ever been uploaded to QC
 * This prevents devs from deleting games that have entered the review process
 */
export function hasEverUploadedToQC(game: Game): boolean {
  // TODO: Implement based on your audit log or game history
  // For now, we'll use a simple heuristic: if game has any versions that were submitted
  // This should be enhanced to check actual submission history
  return false; // Placeholder - implement based on your audit system
}

/**
 * Check if a game has learner sessions (students have played it)
 * This prevents deletion of games that have been used by students
 */
export function hasLearnerSessions(game: Game): boolean {
  // TODO: Implement based on your analytics/session tracking
  // This should check if any students have played this game
  return false; // Placeholder - implement based on your session tracking
}

/**
 * Check if a game is referenced in any lessons or learning paths
 * This prevents deletion of games that are part of curriculum
 */
export function hasLessonMapping(game: Game): boolean {
  // TODO: Implement based on your curriculum/lesson system
  // This should check if game is referenced in any lessons
  return false; // Placeholder - implement based on your lesson system
}

/**
 * Dev can only soft delete their own draft games that haven't been to QC
 */
export function canDevSoftDeleteDraft(user: User, game: Game): boolean {
  if (!hasPermissionString(user, "games:delete_own_draft")) {
    return false;
  }

  const isOwner = game.ownerId === user._id.toString();
  const isNotDeleted = !game.isDeleted;
  const neverUploadedToQC = !hasEverUploadedToQC(game);

  // For draft games, we need to check if the latest version is in draft status
  // This is a simplified check - in practice, you'd check the actual version status
  const isDraftStatus = true; // TODO: Check latest version status

  return isOwner && isNotDeleted && isDraftStatus && neverUploadedToQC;
}

/**
 * CTO/Admin can archive games to remove them from production
 */
export function canArchiveGame(user: User, game: Game): boolean {
  if (!hasPermissionString(user, "games:archive")) {
    return false;
  }

  const isNotDeleted = !game.isDeleted;

  // Can archive games that are in production or approved states
  // This removes them from learner access but preserves all data
  return isNotDeleted;
}

/**
 * Admin can soft delete games (move to trash)
 */
export function canAdminSoftDelete(user: User, game: Game): boolean {
  if (!hasPermissionString(user, "games:delete_soft")) {
    return false;
  }

  const isNotDeleted = !game.isDeleted;

  // Admin can soft delete most games, but should be careful with published ones
  // This is a policy decision - you might want to restrict this further
  return isNotDeleted;
}

/**
 * System/Super-admin can request hard delete for safe games
 */
export function canAdminHardDelete(user: User, game: Game): boolean {
  if (!hasPermissionString(user, "games:delete_hard")) {
    return false;
  }

  const isSoftDeleted = game.isDeleted;
  const noLearnerSessions = !hasLearnerSessions(game);
  const noLessonMapping = !hasLessonMapping(game);

  // Only allow hard delete of games that are:
  // 1. Already soft deleted
  // 2. Have no student sessions
  // 3. Are not referenced in curriculum
  return isSoftDeleted && noLearnerSessions && noLessonMapping;
}

/**
 * Admin can restore soft-deleted games
 */
export function canRestoreGame(user: User, game: Game): boolean {
  if (!hasPermissionString(user, "games:restore")) {
    return false;
  }

  return game.isDeleted === true;
}

/**
 * Check if a game is safe for hard deletion
 * This includes additional safety checks beyond permissions
 */
export function isSafeForHardDelete(game: Game): boolean {
  const isOldEnough = !!(
    game.deletedAt &&
    Date.now() - game.deletedAt.getTime() > 30 * 24 * 60 * 60 * 1000
  ); // 30 days

  const noLearnerSessions = !hasLearnerSessions(game);
  const noLessonMapping = !hasLessonMapping(game);
  const isSoftDeleted = game.isDeleted;

  return isOldEnough && noLearnerSessions && noLessonMapping && isSoftDeleted;
}

/**
 * Get the appropriate delete reason based on user role and context
 */
export function getDeleteReason(
  user: User,
  context: "draft" | "admin" | "system"
): DeleteReason {
  switch (context) {
    case "draft":
      return "dev_draft_deleted";
    case "admin":
      return "admin_soft_delete";
    case "system":
      return "system_cleanup";
    default:
      return "admin_soft_delete";
  }
}
