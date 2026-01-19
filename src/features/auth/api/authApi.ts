/**
 * Auth API Functions
 * Calling external API at NEXT_PUBLIC_BASE_API_URL
 */

import { externalApiGet, externalApiPost } from "@/lib/external-api";
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
    const tokens = await externalApiPost<TokenSchema>(
      "/api/v1/auth/login",
      payload,
    );

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
    await externalApiPost("/api/v1/auth/logout");
    tokenStorage.clearTokens();
    return { success: true };
  } catch (error: any) {
    // Still clear all tokens even if API call fails
    tokenStorage.clearTokens();
    return { success: true };
  }
}

/**
 * Get current user info
 * GET /api/v1/auth/me
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await externalApiGet<CurrentUser>("/api/v1/auth/me");
  } catch {
    return null;
  }
}

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export async function refreshToken(): Promise<RefreshTokenResponse | null> {
  try {
    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (!currentRefreshToken) {
      return null;
    }

    const tokens = await externalApiPost<RefreshTokenResponse>(
      "/api/v1/auth/refresh",
      { refresh_token: currentRefreshToken },
    );

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
