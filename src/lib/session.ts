import 'dotenv/config';
import jwt from 'jsonwebtoken';
import type { Role, User } from '../models/User';
import { UserRepository } from '../models/User';

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
 */
export function createSession(user: User): string {
  const payload = {
    userId: user._id.toString(),
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
 * Get user from request by extracting and verifying session cookie
 */
export async function getUserFromRequest(request: Request): Promise<User | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const token = parseCookie(cookieHeader, COOKIE_NAME);
  if (!token) return null;

  const session = verifySession(token);
  if (!session) return null;

  // Fetch fresh user data from database
  const userRepo = await UserRepository.getInstance();
  return userRepo.findById(session.userId);
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
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

/**
 * Create Set-Cookie header value to clear session
 */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Get the cookie name constant
 */
export function getCookieName(): string {
  return COOKIE_NAME;
}
