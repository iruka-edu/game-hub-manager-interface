import { cookies } from 'next/headers';
import { verifySession, type SessionPayload } from '@/lib/session';
import type { User, Role } from '@/models/User';
import { ROLE_PERMISSIONS, type Permission } from '@/lib/auth-rbac';

/**
 * Cookie name constant - must match src/lib/session.ts
 */
const COOKIE_NAME = 'iruka_session';

/**
 * Get user from cookies (for Server Components)
 * Uses the existing session verification from src/lib/session.ts
 */
export async function getUserFromCookies(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  const session = verifySession(token);
  if (!session) return null;

  return null;
}

/**
 * Get session payload from cookies (without DB lookup)
 * Useful for quick checks where full user data isn't needed
 */
export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  return verifySession(token);
}

/**
 * Get user from request headers (for Route Handlers)
 * Headers are set by middleware after JWT verification
 */
export async function getUserFromHeaders(headers: Headers): Promise<User | null> {
  const userId = headers.get('x-user-id');
  if (!userId) return null;

  return null;
}

/**
 * Get user ID from headers (for quick access without DB lookup)
 */
export function getUserIdFromHeaders(headers: Headers): string | null {
  return headers.get('x-user-id');
}

/**
 * Get user email from headers
 */
export function getUserEmailFromHeaders(headers: Headers): string | null {
  return headers.get('x-user-email');
}

/**
 * Get user roles from headers (for quick permission checks without DB lookup)
 */
export function getRolesFromHeaders(headers: Headers): Role[] {
  const rolesHeader = headers.get('x-user-roles');
  if (!rolesHeader) return [];
  
  try {
    return JSON.parse(rolesHeader) as Role[];
  } catch {
    return [];
  }
}

/**
 * Check if user has a specific role
 */
export function hasRole(roles: Role[], role: Role): boolean {
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles: Role[], requiredRoles: Role[]): boolean {
  return requiredRoles.some(role => roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(roles: Role[], requiredRoles: Role[]): boolean {
  return requiredRoles.every(role => roles.includes(role));
}

/**
 * Check if user has a specific permission based on their roles
 */
export function hasPermission(roles: Role[], permission: Permission): boolean {
  return roles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions && permissions.includes(permission);
  });
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(roles: Role[], permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(roles, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(roles: Role[], permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(roles, permission));
}

/**
 * Get all permissions for a set of roles
 */
export function getPermissionsForRoles(roles: Role[]): Permission[] {
  const permissions = new Set<Permission>();
  
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (rolePerms) {
      rolePerms.forEach(p => permissions.add(p));
    }
  }
  
  return Array.from(permissions);
}

/**
 * Require authentication - throws if not authenticated
 * Use in Server Components or Route Handlers
 */
export async function requireAuth(): Promise<User> {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require specific role - throws if user doesn't have the role
 */
export async function requireRole(role: Role): Promise<User> {
  const user = await requireAuth();
  if (!user.roles.includes(role)) {
    throw new Error('Forbidden');
  }
  return user;
}

/**
 * Require specific permission - throws if user doesn't have the permission
 */
export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireAuth();
  if (!hasPermission(user.roles, permission)) {
    throw new Error('Forbidden');
  }
  return user;
}
