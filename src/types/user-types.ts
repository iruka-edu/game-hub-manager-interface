/**
 * User roles in the system
 * Shared type definition that doesn't depend on mongodb
 */
export type Role = 'dev' | 'qc' | 'cto' | 'ceo' | 'admin';

/**
 * Valid roles array for validation
 */
export const VALID_ROLES: Role[] = ['dev', 'qc', 'cto', 'ceo', 'admin'];

/**
 * Validate that a role is valid
 */
export function isValidRole(role: string): role is Role {
  return VALID_ROLES.includes(role as Role);
}

/**
 * Validate that all roles in an array are valid
 */
export function validateRoles(roles: string[]): roles is Role[] {
  return roles.every(isValidRole);
}
