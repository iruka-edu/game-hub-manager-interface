/**
 * Auth Feature Types
 * Matching BE_vu_v2.json API schemas
 */

import type { Role } from "@/types/user-types";

/**
 * Login request payload
 * Matches UserLogin schema
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Token response from login/refresh
 * Matches TokenSchema from OpenAPI spec
 */
export interface TokenSchema {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
}

/**
 * Current user from /auth/me
 * Matches UserResponse schema from OpenAPI spec
 */
export interface CurrentUser {
  id: string; // UUID format
  email: string;
  full_name: string;
  is_active: boolean;
  roles: Role[];
}

/**
 * Auth session response (local abstraction)
 */
export interface AuthSessionResponse {
  user: CurrentUser | null;
  isAuthenticated: boolean;
}

/**
 * Login response (local abstraction combining token + user)
 */
export interface LoginResponse {
  success: boolean;
  tokens?: TokenSchema;
  user?: CurrentUser | null;
  error?: string;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
