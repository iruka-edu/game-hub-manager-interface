import 'dotenv/config';
import jwt from 'jsonwebtoken';
import type { Role } from '../types/user-types';

/**
 * Session payload stored in JWT
 */
export interface SessionPayload {
  userId: string;
  email: string;
  roles: Role[];
  exp: number;
}

// Session configuration
const SESSION_SECRET = process.env.IRUKA_SESSION_SECRET || 'iruka-dev-secret-key';
const SESSION_EXPIRY = '7d'; // 7 days
const COOKIE_NAME = 'iruka_session';

/**
 * Create a session token for a user
 * Note: User type is inlined to avoid backend coupling
 */
export function createSession(user: { _id: string; email: string; roles: Role[] }): string {
  const payload = {
    userId: user._id,
    email: user.email,
    roles: user.roles,
  };

  return jwt.sign(payload, SESSION_SECRET, { expiresIn: SESSION_EXPIRY });
}

/**
 * Verify and decode a session token
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, SESSION_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}


/**
 * Parse a specific cookie from cookie header string
 */
function parseCookie(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.split('=');
    if (cookieName === name) {
      return valueParts.join('='); // Handle values with '=' in them
    }
  }
  return null;
}

/**
 * Create Set-Cookie header value for session
 */
export function createSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Build cookie string with proper settings for mobile compatibility
  let cookieString = `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}`;
  
  // Add Secure flag for HTTPS in production
  if (isProduction) {
    cookieString += '; Secure';
  }
  
  // Use SameSite=None for better mobile compatibility, fallback to Lax
  // SameSite=None requires Secure flag, so only use in production with HTTPS
  if (isProduction) {
    cookieString += '; SameSite=None';
  } else {
    cookieString += '; SameSite=Lax';
  }
  
  return cookieString;
}

/**
 * Create Set-Cookie header value to clear session
 */
export function clearSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  let cookieString = `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`;
  
  if (isProduction) {
    cookieString += '; Secure; SameSite=None';
  } else {
    cookieString += '; SameSite=Lax';
  }
  
  return cookieString;
}

/**
 * Get the cookie name constant
 */
export function getCookieName(): string {
  return COOKIE_NAME;
}
