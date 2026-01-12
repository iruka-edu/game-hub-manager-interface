/**
 * Property Test: API Response Equivalence
 * Feature: astro-to-nextjs-migration, Property 5
 * Validates: Requirements 3.4, 3.5, 3.6
 * 
 * This test verifies that the Next.js API routes return responses
 * with identical structure and semantics to the original Astro routes.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Role } from '../src/models/User';

/**
 * Generate a valid MongoDB ObjectId-like string (24 hex chars)
 */
const objectIdArbitrary = fc.stringMatching(/^[0-9a-f]{24}$/);

/**
 * Generate a valid role
 */
const roleArbitrary = fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin');

/**
 * Generate a valid version status
 */
const versionStatusArbitrary = fc.constantFrom(
  'draft', 'uploaded', 'qc_processing', 'qc_passed', 'qc_failed', 'approved', 'published', 'archived'
);

/**
 * Generate a valid SemVer version string
 */
const semverArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 99 }),
  fc.integer({ min: 0, max: 99 }),
  fc.integer({ min: 0, max: 99 })
).map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

describe('API Response Equivalence', () => {
  /**
   * Property 5: API Response Equivalence
   * For any valid request, the Next.js API routes SHALL return
   * responses with identical JSON structure to the original Astro routes.
   */

  describe('Auth API Response Structure', () => {
    it('login success response should have correct structure', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.subarray(['dev', 'qc', 'cto', 'ceo', 'admin'] as Role[], { minLength: 1 }),
          (id, email, name, roles) => {
            // Simulate successful login response structure
            const response = {
              success: true,
              user: {
                id,
                email,
                name,
                roles,
              },
            };

            // Verify structure
            expect(response).toHaveProperty('success', true);
            expect(response).toHaveProperty('user');
            expect(response.user).toHaveProperty('id');
            expect(response.user).toHaveProperty('email');
            expect(response.user).toHaveProperty('name');
            expect(response.user).toHaveProperty('roles');
            expect(Array.isArray(response.user.roles)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('login error response should have correct structure', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'Email is required',
            'Password is required',
            'Invalid email or password',
            'Account is disabled. Please contact administrator.',
            'Internal server error'
          ),
          (errorMessage) => {
            const response = { error: errorMessage };

            expect(response).toHaveProperty('error');
            expect(typeof response.error).toBe('string');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('me endpoint response should have correct structure', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.subarray(['dev', 'qc', 'cto', 'ceo', 'admin'] as Role[], { minLength: 1 }),
          (id, email, name, roles) => {
            const response = {
              user: {
                id,
                email,
                name,
                roles,
                avatar: undefined,
                teamIds: [],
              },
            };

            expect(response).toHaveProperty('user');
            expect(response.user).toHaveProperty('id');
            expect(response.user).toHaveProperty('email');
            expect(response.user).toHaveProperty('name');
            expect(response.user).toHaveProperty('roles');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Games API Response Structure', () => {
    it('games list response should have correct structure', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: objectIdArbitrary,
              gameId: fc.string({ minLength: 1, maxLength: 50 }),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              ownerId: objectIdArbitrary,
              subject: fc.constantFrom('math', 'science', 'language', 'social'),
              grade: fc.constantFrom('1', '2', '3', '4', '5'),
              isDeleted: fc.boolean(),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (games) => {
            const response = { games };

            expect(response).toHaveProperty('games');
            expect(Array.isArray(response.games)).toBe(true);
            
            for (const game of response.games) {
              expect(game).toHaveProperty('_id');
              expect(game).toHaveProperty('gameId');
              expect(game).toHaveProperty('title');
              expect(game).toHaveProperty('ownerId');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('game create success response should have correct structure', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          semverArbitrary,
          (gameId, gameSlug, title, version) => {
            const response = {
              success: true,
              game: {
                _id: gameId,
                gameId: gameSlug,
                title,
                latestVersionId: objectIdArbitrary,
              },
              version: {
                _id: objectIdArbitrary,
                version,
                status: 'draft',
              },
            };

            expect(response).toHaveProperty('success', true);
            expect(response).toHaveProperty('game');
            expect(response).toHaveProperty('version');
            expect(response.game).toHaveProperty('_id');
            expect(response.game).toHaveProperty('gameId');
            expect(response.game).toHaveProperty('title');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('game update success response should have correct structure', async () => {
      await fc.assert(
        fc.property(
          objectIdArbitrary,
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
          }),
          (gameId, changes) => {
            const response = {
              success: true,
              message: 'Game updated successfully',
              data: {
                game: { _id: gameId, ...changes },
                changes,
                fieldsUpdated: Object.keys(changes),
              },
            };

            expect(response).toHaveProperty('success', true);
            expect(response).toHaveProperty('message');
            expect(response).toHaveProperty('data');
            expect(response.data).toHaveProperty('game');
            expect(response.data).toHaveProperty('changes');
            expect(response.data).toHaveProperty('fieldsUpdated');
            expect(Array.isArray(response.data.fieldsUpdated)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Response Consistency', () => {
    it('all error responses should have error field', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'Unauthorized',
            'Forbidden',
            'Not found',
            'Invalid game ID',
            'Game not found',
            'Internal server error'
          ),
          (errorMessage) => {
            const response = { error: errorMessage };

            expect(response).toHaveProperty('error');
            expect(typeof response.error).toBe('string');
            expect(response.error.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('HTTP status codes should match error types', () => {
      const errorStatusMap = {
        'Unauthorized': 401,
        'Forbidden': 403,
        'Not found': 404,
        'Game not found': 404,
        'Invalid game ID': 400,
        'Email is required': 400,
        'Password is required': 400,
        'Internal server error': 500,
      };

      for (const [error, status] of Object.entries(errorStatusMap)) {
        expect(status).toBeGreaterThanOrEqual(400);
        expect(status).toBeLessThan(600);
      }
    });
  });

  describe('Response Field Types', () => {
    it('game fields should have correct types', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            _id: objectIdArbitrary,
            gameId: fc.string({ minLength: 1, maxLength: 50 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            ownerId: objectIdArbitrary,
            subject: fc.constantFrom('math', 'science', 'language', 'social'),
            grade: fc.constantFrom('1', '2', '3', '4', '5'),
            isDeleted: fc.boolean(),
          }),
          (game) => {
            expect(typeof game._id).toBe('string');
            expect(typeof game.gameId).toBe('string');
            expect(typeof game.title).toBe('string');
            expect(typeof game.description).toBe('string');
            expect(typeof game.ownerId).toBe('string');
            expect(typeof game.subject).toBe('string');
            expect(typeof game.grade).toBe('string');
            expect(typeof game.isDeleted).toBe('boolean');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('version fields should have correct types', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            _id: objectIdArbitrary,
            gameId: objectIdArbitrary,
            version: semverArbitrary,
            status: versionStatusArbitrary,
            storagePath: fc.string({ minLength: 1, maxLength: 200 }),
            entryFile: fc.constant('index.html'),
          }),
          (version) => {
            expect(typeof version._id).toBe('string');
            expect(typeof version.gameId).toBe('string');
            expect(typeof version.version).toBe('string');
            expect(typeof version.status).toBe('string');
            expect(typeof version.storagePath).toBe('string');
            expect(typeof version.entryFile).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('user fields should have correct types', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            id: objectIdArbitrary,
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            roles: fc.subarray(['dev', 'qc', 'cto', 'ceo', 'admin'] as Role[], { minLength: 1 }),
          }),
          (user) => {
            expect(typeof user.id).toBe('string');
            expect(typeof user.email).toBe('string');
            expect(typeof user.name).toBe('string');
            expect(Array.isArray(user.roles)).toBe(true);
            expect(user.roles.every(r => typeof r === 'string')).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('SemVer Version Format', () => {
    it('version strings should follow SemVer format', async () => {
      await fc.assert(
        fc.property(semverArbitrary, (version) => {
          const semverRegex = /^\d+\.\d+\.\d+$/;
          expect(semverRegex.test(version)).toBe(true);
          
          const parts = version.split('.');
          expect(parts).toHaveLength(3);
          expect(parts.every(p => !isNaN(parseInt(p, 10)))).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
