/**
 * JWT Utility Functions
 * Helper functions for JWT token operations
 */

import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
}

/**
 * Decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @param bufferSeconds - Buffer time in seconds before actual expiry (default: 10)
 * @returns true if token is expired or will expire within buffer time
 */
export function isTokenExpired(
  token: string,
  bufferSeconds: number = 10,
): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // Check if token expires within buffer time
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return expiryTime - currentTime < bufferTime;
}

/**
 * Get token expiry date
 * @param token - JWT token string
 * @returns Expiry date or null if invalid
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}

/**
 * Get time until token expires
 * @param token - JWT token string
 * @returns Milliseconds until expiry, or 0 if expired/invalid
 */
export function getTimeUntilExpiry(token: string): number {
  const expiry = getTokenExpiry(token);
  if (!expiry) {
    return 0;
  }

  const timeUntilExpiry = expiry.getTime() - Date.now();
  return Math.max(0, timeUntilExpiry);
}

/**
 * Check if token is valid (not expired and properly formatted)
 * @param token - JWT token string
 * @returns true if token is valid
 */
export function isTokenValid(token: string): boolean {
  if (!token) {
    return false;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return false;
  }

  return !isTokenExpired(token);
}
