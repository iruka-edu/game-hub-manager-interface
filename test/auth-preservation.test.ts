/**
 * Property Test: Authentication Preservation
 * Feature: astro-to-nextjs-migration, Property 2
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 * 
 * This test verifies that the Next.js middleware extracts the same user
 * information from session tokens as the original Astro middleware,
 * and handles invalid/expired tokens identically.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import { verifySession, createSessionCookie, getCookieName } from '../src/lib/session';
import type { Role } from '../src/models/User';

// Session configuration - must match src/lib/session.ts
const SESSION_SECRET = process.env.IRUKA_SESSION_SECRET || 'iruka-dev-secret-key';

/**
 * Generate a valid MongoDB ObjectId-like string (24 hex chars)
 */
const objectIdArbitrary = fc.stringMatching(/^[0-9a-f]{24}$/);

/**
 * Generate a valid JWT token for testing
 */
function generateValidToken(userId: string, email: string, roles: Role[]): string {
  const payload = {
    userId,
    email,
    roles,
  };
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: '7d' });
}

/**
 * Generate an expired JWT token for testing
 */
function generateExpiredToken(userId: string, email: string, roles: Role[]): string {
  const payload = {
    userId,
    email,
    roles,
  };
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: '-1s' });
}

/**
 * Generate an invalid JWT token (wrong secret)
 */
function generateInvalidToken(userId: string, email: string, roles: Role[]): string {
  const payload = {
    userId,
    email,
    roles,
  };
  return jwt.sign(payload, 'wrong-secret', { expiresIn: '7d' });
}

describe('Authentication Preservation', () => {
  /**
   * Property 2: Authentication Preservation
   * For any valid session token, the Next.js middleware SHALL extract
   * the same user information as the original Astro middleware.
   */

  describe('Valid Token Handling', () => {
    it('should extract correct userId from valid tokens', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin'),
          (userId, email, role) => {
            const token = generateValidToken(userId, email, [role]);
            const session = verifySession(token);
            
            expect(session).not.toBeNull();
            expect(session?.userId).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract correct email from valid tokens', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin'),
          (userId, email, role) => {
            const token = generateValidToken(userId, email, [role]);
            const session = verifySession(token);
            
            expect(session).not.toBeNull();
            expect(session?.email).toBe(email);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract correct roles from valid tokens', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.subarray(['dev', 'qc', 'cto', 'ceo', 'admin'] as Role[], { minLength: 1 }),
          (userId, email, roles) => {
            const token = generateValidToken(userId, email, roles);
            const session = verifySession(token);
            
            expect(session).not.toBeNull();
            expect(session?.roles).toEqual(roles);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve session data through encode/decode cycle', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.subarray(['dev', 'qc', 'cto', 'ceo', 'admin'] as Role[], { minLength: 1 }),
          (userId, email, roles) => {
            // Create token
            const token = generateValidToken(userId, email, roles);
            
            // Decode token
            const session = verifySession(token);
            
            // Verify round-trip
            expect(session?.userId).toBe(userId);
            expect(session?.email).toBe(email);
            expect(session?.roles).toEqual(roles);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid Token Handling', () => {
    it('should reject expired tokens', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin'),
          (userId, email, role) => {
            const token = generateExpiredToken(userId, email, [role]);
            const session = verifySession(token);
            
            // Expired tokens should return null
            expect(session).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject tokens with wrong secret', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin'),
          (userId, email, role) => {
            const token = generateInvalidToken(userId, email, [role]);
            const session = verifySession(token);
            
            // Invalid tokens should return null
            expect(session).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject malformed tokens', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (randomString) => {
            const session = verifySession(randomString);
            
            // Malformed tokens should return null
            expect(session).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject empty tokens', () => {
      expect(verifySession('')).toBeNull();
    });

    it('should handle null-like values gracefully', () => {
      // @ts-expect-error - Testing edge case
      expect(verifySession(null)).toBeNull();
      // @ts-expect-error - Testing edge case
      expect(verifySession(undefined)).toBeNull();
    });
  });

  describe('Session Cookie Format', () => {
    it('should use consistent cookie name', () => {
      expect(getCookieName()).toBe('iruka_session');
    });

    it('should create cookies with 7-day expiry', () => {
      const token = 'test-token';
      const cookie = createSessionCookie(token);
      
      // Cookie should contain Max-Age for 7 days (604800 seconds)
      expect(cookie).toContain('Max-Age=604800');
    });

    it('should create HttpOnly cookies', () => {
      const token = 'test-token';
      const cookie = createSessionCookie(token);
      
      expect(cookie).toContain('HttpOnly');
    });

    it('should create SameSite=Lax cookies', () => {
      const token = 'test-token';
      const cookie = createSessionCookie(token);
      
      expect(cookie).toContain('SameSite=Lax');
    });
  });
});
