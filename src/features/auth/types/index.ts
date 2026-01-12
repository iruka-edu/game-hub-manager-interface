/**
 * Auth Feature Types
 */

import type { Role } from "@/types/user-types";

/**
 * Current user session
 */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  avatar?: string;
}

/**
 * Auth session response
 */
export interface AuthSessionResponse {
  user: CurrentUser | null;
  isAuthenticated: boolean;
}

/**
 * Login payload
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  user?: CurrentUser;
  error?: string;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
}
