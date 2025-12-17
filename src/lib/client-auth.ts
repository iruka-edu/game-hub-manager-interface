import type { Permission } from '../auth/auth-rbac';
import type { User } from '../models/User';

/**
 * Client-side authentication context
 */
export interface ClientAuth {
  user: User;
  permissions: Permission[];
  can: (permission: Permission) => boolean;
}

/**
 * Create a client auth helper from user and permissions
 * @param user - The authenticated user
 * @param permissions - Array of permission strings
 * @returns ClientAuth object with helper methods
 */
export function createClientAuth(user: User, permissions: Permission[]): ClientAuth {
  return {
    user,
    permissions,
    can: (permission: Permission) => permissions.includes(permission),
  };
}

/**
 * Check if a permission is in the permissions array
 * Standalone function for use without full ClientAuth object
 * @param permissions - Array of permission strings
 * @param permission - Permission to check
 * @returns boolean indicating if permission is present
 */
export function canDo(permissions: Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}
