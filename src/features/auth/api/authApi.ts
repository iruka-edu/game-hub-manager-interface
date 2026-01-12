/**
 * Auth API Functions
 */

import { apiGet, apiPost } from "@/lib/api-fetch";
import type {
  AuthSessionResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
} from "../types";

/**
 * Get current session
 * GET /api/auth/session
 */
export async function getSession(): Promise<AuthSessionResponse> {
  return apiGet<AuthSessionResponse>("/api/auth/session");
}

/**
 * Login
 * POST /api/auth/login
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/api/auth/login", payload);
}

/**
 * Logout
 * POST /api/auth/logout
 */
export async function logout(): Promise<LogoutResponse> {
  return apiPost<LogoutResponse>("/api/auth/logout");
}
