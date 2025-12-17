import type { User, Role } from '../models/User';

/**
 * String-based permissions for simple RBAC checks
 */
export type Permission = 
  | 'games:view' 
  | 'games:create' 
  | 'games:update' 
  | 'games:submit' 
  | 'games:review' 
  | 'games:approve' 
  | 'games:publish'
  | 'system:audit_view';

/**
 * All available permissions
 */
export const ALL_PERMISSIONS: Permission[] = [
  'games:view',
  'games:create',
  'games:update',
  'games:submit',
  'games:review',
  'games:approve',
  'games:publish',
  'system:audit_view',
];

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  dev: [
    'games:view',
    'games:create',
    'games:update',
    'games:submit',
  ],
  qc: [
    'games:view',
    'games:review',
  ],
  cto: [
    'games:view',
    'games:approve',
    'system:audit_view',
  ],
  ceo: [
    'games:view',
    'games:approve',
  ],
  admin: [
    'games:view',
    'games:create',
    'games:update',
    'games:submit',
    'games:review',
    'games:approve',
    'games:publish',
    'system:audit_view',
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
export function hasPermissionString(user: User, permission: Permission): boolean {
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
      rolePerms.forEach(p => permissions.add(p));
    }
  }
  
  return Array.from(permissions);
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermissionString(user, p));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermissionString(user, p));
}
