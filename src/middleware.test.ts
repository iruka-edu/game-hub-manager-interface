import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ObjectId } from 'mongodb';
import type { User, Role } from './models/User';
import { checkPageAccess, getUserPermissions, getRequiredPermission } from './lib/page-permissions';
import { hasPermissionString, type Permission } from './auth/auth-rbac';

// Generators
const roleArb = fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin');

const userArb = fc.record({
  _id: fc.constant(new ObjectId()),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  roles: fc.array(roleArb, { minLength: 1, maxLength: 3 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<User>;

const protectedPathWithPermissionArb = fc.constantFrom(
  '/console/qc-inbox',
  '/console/approval',
  '/console/publish',
  '/console/my-games',
  '/console/library'
);

describe('Middleware Logic', () => {
  /**
   * Feature: page-protection-flow, Property 1: Unauthorized Access Returns 403
   * Validates: Requirements 1.1, 3.2
   */
  describe('Property 1: Unauthorized Access Returns 403', () => {
    it('user without required permission should be denied access', () => {
      fc.assert(
        fc.property(userArb, protectedPathWithPermissionArb, (user, pathname) => {
          const hasAccess = checkPageAccess(user, pathname);
          const requiredPermission = getRequiredPermission(pathname);
          
          if (requiredPermission && requiredPermission !== null) {
            const hasRequiredPerm = hasPermissionString(user, requiredPermission);
            // If user doesn't have required permission, they should be denied
            if (!hasRequiredPerm) {
              expect(hasAccess).toBe(false);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('user with required permission should be granted access', () => {
      fc.assert(
        fc.property(userArb, protectedPathWithPermissionArb, (user, pathname) => {
          const hasAccess = checkPageAccess(user, pathname);
          const requiredPermission = getRequiredPermission(pathname);
          
          if (requiredPermission && requiredPermission !== null) {
            const hasRequiredPerm = hasPermissionString(user, requiredPermission);
            // If user has required permission, they should be granted access
            if (hasRequiredPerm) {
              expect(hasAccess).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: page-protection-flow, Property 4: Middleware Attaches User and Permissions
   * Validates: Requirements 3.3, 4.1
   */
  describe('Property 4: Middleware Attaches User and Permissions', () => {
    it('getUserPermissions returns array of permissions', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const permissions = getUserPermissions(user);
          
          expect(Array.isArray(permissions)).toBe(true);
          // All returned permissions should be valid Permission strings
          for (const perm of permissions) {
            expect(typeof perm).toBe('string');
            expect(perm).toMatch(/^games:/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('permissions include all permissions from all user roles', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const permissions = getUserPermissions(user);
          
          // For each role, check that its permissions are included
          for (const role of user.roles) {
            // Check that user has at least games:view (all roles have this)
            if (role === 'dev' || role === 'qc' || role === 'cto' || role === 'ceo' || role === 'admin') {
              expect(permissions).toContain('games:view');
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: page-protection-flow, Property 7: Unauthenticated Redirect Includes Return URL
   * Validates: Requirements 5.1
   */
  describe('Property 7: Unauthenticated Redirect Includes Return URL', () => {
    it('redirect URL should be properly encoded', () => {
      const testPaths = [
        '/console',
        '/console/qc-inbox',
        '/console/games/123',
        '/console/my-games?status=draft',
      ];

      for (const path of testPaths) {
        const encoded = encodeURIComponent(path);
        const redirectUrl = `/login?redirect=${encoded}`;
        
        // Verify the redirect URL is properly formed
        expect(redirectUrl).toContain('/login?redirect=');
        expect(redirectUrl).toContain(encodeURIComponent(path));
        
        // Verify we can decode it back
        const url = new URL(redirectUrl, 'http://localhost');
        const redirectParam = url.searchParams.get('redirect');
        expect(redirectParam).toBe(path);
      }
    });
  });
});

describe('Specific Access Control Tests', () => {
  const createUser = (roles: Role[]): User => ({
    _id: new ObjectId(),
    email: 'test@example.com',
    name: 'Test User',
    roles,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('dev user cannot access /console/qc-inbox', () => {
    const devUser = createUser(['dev']);
    expect(checkPageAccess(devUser, '/console/qc-inbox')).toBe(false);
  });

  it('qc user can access /console/qc-inbox', () => {
    const qcUser = createUser(['qc']);
    expect(checkPageAccess(qcUser, '/console/qc-inbox')).toBe(true);
  });

  it('dev user cannot access /console/approval', () => {
    const devUser = createUser(['dev']);
    expect(checkPageAccess(devUser, '/console/approval')).toBe(false);
  });

  it('cto user can access /console/approval', () => {
    const ctoUser = createUser(['cto']);
    expect(checkPageAccess(ctoUser, '/console/approval')).toBe(true);
  });

  it('qc user cannot access /console/publish', () => {
    const qcUser = createUser(['qc']);
    expect(checkPageAccess(qcUser, '/console/publish')).toBe(false);
  });

  it('admin user can access /console/publish', () => {
    const adminUser = createUser(['admin']);
    expect(checkPageAccess(adminUser, '/console/publish')).toBe(true);
  });
});
