/**
 * User roles in the system
 */
export type Role = "dev" | "qc" | "reviewer" | "publisher" | "admin";

/**
 * Valid roles array for validation
 */
export const VALID_ROLES: Role[] = [
  "dev",
  "qc",
  "reviewer",
  "publisher",
  "admin",
];

/**
 * User interface representing a user record
 */
export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  roles: Role[];
  isActive: boolean;
  avatar?: string;
  teamIds?: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new user
 */
export type CreateUserInput = Omit<
  User,
  "_id" | "createdAt" | "updatedAt" | "passwordHash"
> & {
  password: string;
};

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
