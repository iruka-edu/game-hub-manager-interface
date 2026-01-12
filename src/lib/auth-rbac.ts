import type { User, Role } from "../models/User";

/**
 * String-based permissions for simple RBAC checks
 */
export type Permission =
  | "games:view"
  | "games:create"
  | "games:update"
  | "games:submit"
  | "games:review"
  | "games:approve"
  | "games:publish"
  | "games:play"                // All users can play games
  | "games:delete_own_draft"    // Dev can delete own draft games
  | "games:archive"             // CTO/Admin can archive games
  | "games:delete_soft"         // Admin can soft delete games
  | "games:delete_hard"         // System/Super-admin can hard delete
  | "games:restore"             // Admin can restore soft-deleted games
  | "system:audit_view"
  | "system:admin";

/**
 * All available permissions
 */
export const ALL_PERMISSIONS: Permission[] = [
  "games:view",
  "games:create",
  "games:update",
  "games:submit",
  "games:review",
  "games:approve",
  "games:publish",
  "games:play",
  "games:delete_own_draft",
  "games:archive",
  "games:delete_soft",
  "games:delete_hard",
  "games:restore",
  "system:audit_view",
  "system:admin",
];

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  dev: ["games:view", "games:create", "games:update", "games:submit", "games:play", "games:delete_own_draft"],
  qc: ["games:view", "games:review", "games:play"],
  cto: ["games:view", "games:approve", "games:archive", "games:play", "system:audit_view"],
  ceo: ["games:view", "games:approve", "games:play"],
  admin: [
    "games:view",
    "games:create",
    "games:update",
    "games:submit",
    "games:review",
    "games:approve",
    "games:publish",
    "games:play",
    "games:delete_own_draft",
    "games:archive",
    "games:delete_soft",
    "games:restore",
    "system:audit_view",
    "system:admin",
  ],
};

/**
 * Check if a user has a specific permission string
 * Returns true if any of the user's roles include the permission
 *
 * @param user - The user to check
 * @param permission - The permission string to check
 * @returns boolean indicating if the user has the permission
 */
export function hasPermissionString(
  user: User,
  permission: Permission
): boolean {
  for (const role of user.roles) {
    const permissions = ROLE_PERMISSIONS[role];
    if (permissions && permissions.includes(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Get all permissions for a user based on their roles
 */
export function getUserPermissions(user: User): Permission[] {
  const permissions = new Set<Permission>();

  for (const role of user.roles) {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (rolePerms) {
      rolePerms.forEach((p) => permissions.add(p));
    }
  }

  return Array.from(permissions);
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: User,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermissionString(user, p));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: User,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermissionString(user, p));
}
