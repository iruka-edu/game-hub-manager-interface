import type { User } from '../models/User';
import { type Permission, hasPermissionString, getUserPermissions } from '../auth/auth-rbac';

/**
 * Configuration for page-level permission requirements
 */
export interface PagePermissionConfig {
  pattern: string;
  permission: Permission | null; // null = any authenticated user
}

/**
 * Page permission mappings - order matters (more specific patterns first)
 */
export const PAGE_PERMISSIONS: PagePermissionConfig[] = [
  { pattern: '/console/qc-inbox', permission: 'games:review' },
  { pattern: '/console/approval', permission: 'games:approve' },
  { pattern: '/console/publish', permission: 'games:publish' },
  { pattern: '/console/audit-logs', permission: 'system:audit_view' },
  { pattern: '/console/my-games', permission: 'games:view' },
  { pattern: '/console/library', permission: 'games:view' },
  { pattern: '/console/games', permission: 'games:view' },
  { pattern: '/console', permission: null }, // Dashboard - any authenticated user
];

/**
 * Get the required permission for a given pathname
 * Returns:
 * - Permission string if specific permission required
 * - null if any authenticated user can access
 * - undefined if route is not in the mapping (not protected by page permissions)
 */
export function getRequiredPermission(pathname: string): Permission | null | undefined {
  for (const config of PAGE_PERMISSIONS) {
    if (pathname === config.pattern || pathname.startsWith(config.pattern + '/')) {
      return config.permission;
    }
  }
  return undefined;
}

/**
 * Check if a user has access to a specific page
 * @param user - The user to check
 * @param pathname - The page pathname
 * @returns true if user has access, false otherwise
 */
export function checkPageAccess(user: User, pathname: string): boolean {
  const requiredPermission = getRequiredPermission(pathname);
  
  // Route not in mapping - allow access (handled elsewhere)
  if (requiredPermission === undefined) {
    return true;
  }
  
  // No specific permission required - any authenticated user
  if (requiredPermission === null) {
    return true;
  }
  
  // Check if user has the required permission
  return hasPermissionString(user, requiredPermission);
}

/**
 * Get all permissions for a user (re-export for convenience)
 */
export { getUserPermissions };
