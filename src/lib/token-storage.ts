/**
 * Token Storage - Cookie-based storage for auth tokens
 * Uses js-cookie for client-side cookie management
 * This enables Next.js Middleware to read tokens for route protection
 */

import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Cookie options for security
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7, // 7 days
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

/**
 * Token Storage API
 */
export const tokenStorage = {
  /**
   * Get access token from cookies
   */
  getToken: (): string | undefined => {
    if (typeof window === "undefined") return undefined;
    return Cookies.get(ACCESS_TOKEN_KEY);
  },

  /**
   * Set access token to cookies
   */
  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    Cookies.set(ACCESS_TOKEN_KEY, token, COOKIE_OPTIONS);
  },

  /**
   * Get refresh token from cookies
   */
  getRefreshToken: (): string | undefined => {
    if (typeof window === "undefined") return undefined;
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  /**
   * Set refresh token to cookies
   */
  setRefreshToken: (token: string): void => {
    if (typeof window === "undefined") return;
    Cookies.set(REFRESH_TOKEN_KEY, token, COOKIE_OPTIONS);
  },

  /**
   * Set both tokens at once
   */
  setTokens: (accessToken: string, refreshToken: string): void => {
    tokenStorage.setToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
  },

  /**
   * Clear all auth tokens
   */
  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  },

  /**
   * Check if user has token (quick auth check)
   */
  hasToken: (): boolean => {
    return !!tokenStorage.getToken();
  },
};

// Export individual functions for backward compatibility
export const getAccessToken = tokenStorage.getToken;
export const setAccessToken = tokenStorage.setToken;
export const getRefreshToken = tokenStorage.getRefreshToken;
export const setRefreshToken = tokenStorage.setRefreshToken;
export const clearAllTokens = tokenStorage.clearTokens;

export default tokenStorage;
