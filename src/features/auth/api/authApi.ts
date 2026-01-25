/**
 * Auth API Functions
 * Calling backend API at NEXT_PUBLIC_BASE_API_URL
 */

import { apiGet, apiPost } from "@/lib/api-fetch";
import { tokenStorage } from "@/lib/token-storage";
import type {
  CurrentUser,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  TokenSchema,
  RefreshTokenResponse,
} from "../types";

/**
 * Login
 * POST /api/v1/auth/login
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const tokens = await apiPost<TokenSchema>("/api/v1/auth/login", payload);

    // Store both access and refresh tokens in cookies
    tokenStorage.setToken(tokens.access_token);
    if (tokens.refresh_token) {
      tokenStorage.setRefreshToken(tokens.refresh_token);
    }

    // Get user info after login
    const user = await getCurrentUser();

    return {
      success: true,
      tokens,
      user,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Đăng nhập thất bại",
    };
  }
}

/**
 * Logout
 * POST /api/v1/auth/logout
 */
export async function logout(): Promise<LogoutResponse> {
  try {
    await apiPost("/api/v1/auth/logout");
  } catch (error: any) {
    console.error("Logout API failed:", error);
  } finally {
    // Still clear all tokens even if API call fails
    tokenStorage.clearTokens();

    // Hard reload to clear RAM, Queue, and all state
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
  return { success: true };
}

/**
 * Get current user info
 * GET /api/v1/auth/me
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiGet<CurrentUser>("/api/v1/auth/me");
  } catch {
    return null;
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 * Note: Backend reads refresh_token from cookie automatically
 */
export async function refreshToken(): Promise<RefreshTokenResponse | null> {
  try {
    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (!currentRefreshToken) {
      return null;
    }

    // Backend reads refresh_token from cookie automatically (withCredentials: true)
    // No need to send it in body
    const tokens = await apiPost<RefreshTokenResponse>("/api/v1/auth/refresh");

    // Save both new tokens
    tokenStorage.setToken(tokens.access_token);
    if (tokens.refresh_token) {
      tokenStorage.setRefreshToken(tokens.refresh_token);
    }

    return tokens;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

/**
 * Get current session (combines token check + user fetch)
 */
export async function getSession(): Promise<{
  user: CurrentUser | null;
  isAuthenticated: boolean;
}> {
  // Quick check if token exists
  if (!tokenStorage.hasToken()) {
    return {
      user: null,
      isAuthenticated: false,
    };
  }

  const user = await getCurrentUser();
  return {
    user,
    isAuthenticated: user !== null,
  };
}
