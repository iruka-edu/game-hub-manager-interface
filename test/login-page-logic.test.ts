import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Validate redirect URL (same logic as login.astro)
 */
function isValidRedirect(url: string | null): boolean {
  if (!url) return false;
  // Must start with / and not be //
  return url.startsWith('/') && !url.startsWith('//');
}

describe('Login Page Logic', () => {
  /**
   * Feature: page-protection-flow, Property 8: Post-Login Redirect Honors Parameter
   * Validates: Requirements 5.2
   */
  describe('Property 8: Post-Login Redirect Honors Parameter', () => {
    it('valid internal paths are accepted', () => {
      const validPaths = [
        '/console',
        '/console/qc-inbox',
        '/console/games/123',
        '/dashboard',
        '/console/my-games?status=draft',
      ];

      for (const path of validPaths) {
        expect(isValidRedirect(path)).toBe(true);
      }
    });

    it('invalid or external paths are rejected', () => {
      const invalidPaths = [
        null,
        '',
        '//evil.com',
        'http://evil.com',
        'https://evil.com',
        'javascript:alert(1)',
      ];

      for (const path of invalidPaths) {
        expect(isValidRedirect(path)).toBe(false);
      }
    });

    it('any path starting with single / is valid', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.startsWith('/')),
          (pathSuffix) => {
            const path = '/' + pathSuffix;
            // Should be valid unless it becomes //
            if (path.startsWith('//')) {
              expect(isValidRedirect(path)).toBe(false);
            } else {
              expect(isValidRedirect(path)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Redirect URL Validation', () => {
    it('returns false for null', () => {
      expect(isValidRedirect(null)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidRedirect('')).toBe(false);
    });

    it('returns false for protocol-relative URLs', () => {
      expect(isValidRedirect('//evil.com')).toBe(false);
      expect(isValidRedirect('//localhost')).toBe(false);
    });

    it('returns true for valid internal paths', () => {
      expect(isValidRedirect('/console')).toBe(true);
      expect(isValidRedirect('/console/qc-inbox')).toBe(true);
    });
  });
});
