/**
 * Property Test: Authorization Consistency
 * Feature: astro-to-nextjs-migration, Property 3
 * Validates: Requirements 2.5, 2.6, 5.4
 * 
 * This test verifies that the Next.js middleware enforces the same
 * permission rules as the original Astro middleware, ensuring that
 * role-based access control is preserved during migration.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { User, Role } from '../src/models/User';
import {
  hasPermissionString,
  hasAllPermissions,
  hasAnyPermission,
  getUserPermissions,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  type Permission,
} from '../src/auth/auth-rbac';
import {
  getRequiredPermission,
  checkPageAccess,
  PAGE_PERMISSIONS,
} from '../src/lib/page-permissions';

/**
 * Generate a valid MongoDB ObjectId-like string (24 hex chars)
 */
const objectIdArbitrary = fc.stringMatching(/^[0-9a-f]{24}$/);

/**
 * Generate a valid role
 */
const roleArbitrary = fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin');

/**
 * Generate a valid permission
 */
const permissionArbitrary = fc.constantFrom<Permission>(...ALL_PERMISSIONS);

/**
 * Generate a mock user with random roles
 */
const userArbitrary = fc.record({
  _id: objectIdArbitrary,
  email: fc.emailAddress(),
  roles: fc.subarray(['dev', 'qc', 'cto', 'ceo', 'admin'] as Role[], { minLength: 1 }),
  passwordHash: fc.constant('$2a$10$hashedpassword'),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<User>;

/**
 * Generate a page path from the defined page permissions
 */
const pagePathArbitrary = fc.constantFrom(
  ...PAGE_PERMISSIONS.map(p => p.pattern),
  '/console',
  '/console/my-games',
  '/console/qc-inbox',
  '/console/approval',
  '/console/publish',
  '/console/audit-logs',
  '/admin/sync-games',
  '/admin/debug-games',
);

describe('Authorization Consistency', () => {
  /**
   * Property 3: Authorization Consistency
   * For any user with roles R, the Next.js middleware SHALL grant
   * access to exactly the same routes as the original Astro middleware.
   */

  describe('Role-Permission Mapping', () => {
    it('should return consistent permissions for the same role', async () => {
      await fc.assert(
        fc.property(roleArbitrary, (role) => {
          const user1: User = {
            _id: '000000000000000000000001',
            email: 'test1@example.com',
            roles: [role],
            passwordHash: '$2a$10$hash',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const user2: User = {
            _id: '000000000000000000000002',
            email: 'test2@example.com',
            roles: [role],
            passwordHash: '$2a$10$hash',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const perms1 = getUserPermissions(user1);
          const perms2 = getUserPermissions(user2);

          // Same role should yield same permissions
          expect(perms1.sort()).toEqual(perms2.sort());
        }),
        { numRuns: 50 }
      );
    });

    it('should grant all defined permissions for each role', async () => {
      await fc.assert(
        fc.property(roleArbitrary, (role) => {
          const user: User = {
            _id: '000000000000000000000001',
            email: 'test@example.com',
            roles: [role],
            passwordHash: '$2a$10$hash',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const expectedPermissions = ROLE_PERMISSIONS[role];
          const actualPermissions = getUserPermissions(user);

          // User should have exactly the permissions defined for their role
          expect(actualPermissions.sort()).toEqual(expectedPermissions.sort());
        }),
        { numRuns: 10 }
      );
    });

    it('should combine permissions from multiple roles', async () => {
      await fc.assert(
        fc.property(
          fc.subarray(['dev', 'qc', 'cto', 'ceo', 'admin'] as Role[], { minLength: 2 }),
          (roles) => {
            const user: User = {
              _id: '000000000000000000000001',
              email: 'test@example.com',
              roles,
              passwordHash: '$2a$10$hash',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const actualPermissions = new Set(getUserPermissions(user));
            
            // User should have union of all role permissions
            for (const role of roles) {
              for (const perm of ROLE_PERMISSIONS[role]) {
                expect(actualPermissions.has(perm)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Permission Checking', () => {
    it('hasPermissionString should be consistent with getUserPermissions', async () => {
      await fc.assert(
        fc.property(userArbitrary, permissionArbitrary, (user, permission) => {
          const hasPermViaString = hasPermissionString(user, permission);
          const hasPermViaList = getUserPermissions(user).includes(permission);

          // Both methods should agree
          expect(hasPermViaString).toBe(hasPermViaList);
        }),
        { numRuns: 100 }
      );
    });

    it('hasAllPermissions should require all permissions', async () => {
      await fc.assert(
        fc.property(
          userArbitrary,
          fc.subarray([...ALL_PERMISSIONS], { minLength: 1, maxLength: 3 }),
          (user, permissions) => {
            const hasAll = hasAllPermissions(user, permissions);
            const individualChecks = permissions.every(p => hasPermissionString(user, p));

            expect(hasAll).toBe(individualChecks);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hasAnyPermission should require at least one permission', async () => {
      await fc.assert(
        fc.property(
          userArbitrary,
          fc.subarray([...ALL_PERMISSIONS], { minLength: 1, maxLength: 3 }),
          (user, permissions) => {
            const hasAny = hasAnyPermission(user, permissions);
            const individualChecks = permissions.some(p => hasPermissionString(user, p));

            expect(hasAny).toBe(individualChecks);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Page Access Control', () => {
    it('should grant page access based on user permissions', async () => {
      await fc.assert(
        fc.property(userArbitrary, pagePathArbitrary, (user, path) => {
          const hasAccess = checkPageAccess(user, path);
          const requiredPermission = getRequiredPermission(path);

          if (requiredPermission === undefined) {
            // Route not in mapping - should allow
            expect(hasAccess).toBe(true);
          } else if (requiredPermission === null) {
            // Any authenticated user - should allow
            expect(hasAccess).toBe(true);
          } else {
            // Specific permission required
            const hasPermission = hasPermissionString(user, requiredPermission);
            expect(hasAccess).toBe(hasPermission);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should deny access to protected pages for users without permission', () => {
      // Dev user should not access QC inbox
      const devUser: User = {
        _id: '000000000000000000000001',
        email: 'dev@example.com',
        roles: ['dev'],
        passwordHash: '$2a$10$hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(checkPageAccess(devUser, '/console/qc-inbox')).toBe(false);
      expect(checkPageAccess(devUser, '/console/approval')).toBe(false);
      expect(checkPageAccess(devUser, '/console/publish')).toBe(false);
      expect(checkPageAccess(devUser, '/admin/sync-games')).toBe(false);
    });

    it('should grant access to protected pages for users with permission', () => {
      // QC user should access QC inbox
      const qcUser: User = {
        _id: '000000000000000000000001',
        email: 'qc@example.com',
        roles: ['qc'],
        passwordHash: '$2a$10$hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(checkPageAccess(qcUser, '/console/qc-inbox')).toBe(true);
      expect(checkPageAccess(qcUser, '/console/my-games')).toBe(true);
      expect(checkPageAccess(qcUser, '/console')).toBe(true);
    });

    it('admin should have access to all protected pages', () => {
      const adminUser: User = {
        _id: '000000000000000000000001',
        email: 'admin@example.com',
        roles: ['admin'],
        passwordHash: '$2a$10$hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const config of PAGE_PERMISSIONS) {
        expect(checkPageAccess(adminUser, config.pattern)).toBe(true);
      }
    });
  });

  describe('Role Hierarchy', () => {
    it('dev role should have basic game permissions', () => {
      const devPerms = ROLE_PERMISSIONS['dev'];
      
      expect(devPerms).toContain('games:view');
      expect(devPerms).toContain('games:create');
      expect(devPerms).toContain('games:update');
      expect(devPerms).toContain('games:submit');
      expect(devPerms).toContain('games:delete_own_draft');
      expect(devPerms).not.toContain('games:review');
      expect(devPerms).not.toContain('games:approve');
      expect(devPerms).not.toContain('games:publish');
    });

    it('qc role should have review permissions', () => {
      const qcPerms = ROLE_PERMISSIONS['qc'];
      
      expect(qcPerms).toContain('games:view');
      expect(qcPerms).toContain('games:review');
      expect(qcPerms).not.toContain('games:create');
      expect(qcPerms).not.toContain('games:approve');
    });

    it('cto role should have approval and audit permissions', () => {
      const ctoPerms = ROLE_PERMISSIONS['cto'];
      
      expect(ctoPerms).toContain('games:view');
      expect(ctoPerms).toContain('games:approve');
      expect(ctoPerms).toContain('games:archive');
      expect(ctoPerms).toContain('system:audit_view');
      expect(ctoPerms).not.toContain('games:publish');
    });

    it('admin role should have all critical permissions', () => {
      const adminPerms = ROLE_PERMISSIONS['admin'];
      
      expect(adminPerms).toContain('games:view');
      expect(adminPerms).toContain('games:create');
      expect(adminPerms).toContain('games:update');
      expect(adminPerms).toContain('games:submit');
      expect(adminPerms).toContain('games:review');
      expect(adminPerms).toContain('games:approve');
      expect(adminPerms).toContain('games:publish');
      expect(adminPerms).toContain('games:archive');
      expect(adminPerms).toContain('games:delete_soft');
      expect(adminPerms).toContain('games:restore');
      expect(adminPerms).toContain('system:audit_view');
      expect(adminPerms).toContain('system:admin');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with empty roles array gracefully', () => {
      const userWithNoRoles: User = {
        _id: '000000000000000000000001',
        email: 'noroles@example.com',
        roles: [] as Role[],
        passwordHash: '$2a$10$hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const permissions = getUserPermissions(userWithNoRoles);
      expect(permissions).toEqual([]);

      // Should not have any permission
      for (const perm of ALL_PERMISSIONS) {
        expect(hasPermissionString(userWithNoRoles, perm)).toBe(false);
      }
    });

    it('should handle duplicate roles correctly', () => {
      const userWithDuplicates: User = {
        _id: '000000000000000000000001',
        email: 'duplicates@example.com',
        roles: ['dev', 'dev', 'dev'] as Role[],
        passwordHash: '$2a$10$hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const permissions = getUserPermissions(userWithDuplicates);
      const uniquePermissions = [...new Set(permissions)];

      // Should not have duplicate permissions
      expect(permissions.length).toBe(uniquePermissions.length);
      expect(permissions.sort()).toEqual(ROLE_PERMISSIONS['dev'].sort());
    });
  });
});
