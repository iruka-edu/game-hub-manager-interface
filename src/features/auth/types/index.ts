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
 * Matches TokenSchema
 */
export interface TokenSchema {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/**
 * Current user from /auth/me
 * Based on UserResponse but simplified for auth context
 */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  is_active: boolean;
  avatar?: string;
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
