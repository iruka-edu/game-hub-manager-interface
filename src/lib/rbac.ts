export type Role = "dev" | "qc" | "reviewer" | "publisher" | "admin";

export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_MY_GAMES: "view_my_games",
  VIEW_GAME_LIBRARY: "view_game_library",
  VIEW_QC_INBOX: "view_qc_inbox",
  VIEW_REVIEW_QUEUE: "view_review_queue",
  VIEW_PUBLISH_QUEUE: "view_publish_queue",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_USERS: "view_users",

  UPLOAD_GAME: "upload_game",
  EDIT_GAME: "edit_game",
  SUBMIT_QC: "submit_qc",

  MANAGE_QC_ISSUES: "manage_qc_issues", // Create/Close
  UPDATE_QC_ISSUES: "update_qc_issues", // In Progress/Resolved

  APPROVE_GAME: "approve_game",
  REJECT_GAME: "reject_game",

  PUBLISH_GAME: "publish_game",
  UNPUBLISH_GAME: "unpublish_game",

  MANAGE_USERS: "manage_users",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Matrix mapping from User Request
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  dev: [
    PERMISSIONS.VIEW_MY_GAMES,
    PERMISSIONS.VIEW_GAME_LIBRARY,
    PERMISSIONS.UPLOAD_GAME,
    PERMISSIONS.EDIT_GAME, // Only draft
    PERMISSIONS.SUBMIT_QC,
    PERMISSIONS.UPDATE_QC_ISSUES,
  ],
  qc: [
    PERMISSIONS.VIEW_QC_INBOX,
    PERMISSIONS.VIEW_GAME_LIBRARY,
    PERMISSIONS.MANAGE_QC_ISSUES,
    PERMISSIONS.UPDATE_QC_ISSUES,
  ],
  reviewer: [
    PERMISSIONS.VIEW_REVIEW_QUEUE,
    PERMISSIONS.VIEW_GAME_LIBRARY,
    PERMISSIONS.APPROVE_GAME,
    PERMISSIONS.REJECT_GAME,
  ],
  publisher: [
    PERMISSIONS.VIEW_PUBLISH_QUEUE,
    PERMISSIONS.VIEW_GAME_LIBRARY,
    PERMISSIONS.PUBLISH_GAME,
    PERMISSIONS.UNPUBLISH_GAME,
  ],
  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MY_GAMES, // Support
    PERMISSIONS.VIEW_GAME_LIBRARY,
    PERMISSIONS.VIEW_QC_INBOX, // Support
    PERMISSIONS.VIEW_REVIEW_QUEUE,
    PERMISSIONS.VIEW_PUBLISH_QUEUE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.APPROVE_GAME, // Emergency
    PERMISSIONS.REJECT_GAME, // Emergency
    PERMISSIONS.PUBLISH_GAME,
    PERMISSIONS.UNPUBLISH_GAME,
    PERMISSIONS.MANAGE_QC_ISSUES,
  ],
};

export function hasPermission(
  userRoles: Role[],
  permission: Permission,
): boolean {
  if (!userRoles) return false;
  return userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}
