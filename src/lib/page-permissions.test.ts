import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ObjectId } from 'mongodb';
import { 
  PAGE_PERMISSIONS, 
  getRequiredPermission, 
  checkPageAccess,
  getUserPermissions 
} from './page-permissions';
import type { User, Role } from '../models/User';
import { ROLE_PERMISSIONS, type Permission } from './auth-rbac';

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

const protectedPathArb = fc.constantFrom(
  '/console',
  '/console/qc-inbox',
  '/console/approval',
  '/console/publish',
  '/console/my-games',
  '/console/library',
  '/console/games',
  '/console/games/123'
);

describe('Page Permissions', () => {
  /**
   * Feature: page-protection-flow, Property 3: Permission Check Determinism
   * Validates: Requirements 3.4
   */
  describe('Property 3: Permission Check Determinism', () => {
    it('checkPageAccess returns same result for same inputs', () => {
      fc.assert(
        fc.property(userArb, protectedPathArb, (user, pathname) => {
          const result1 = checkPageAccess(user, pathname);
          const result2 = checkPageAccess(user, pathname);
          const result3 = checkPageAccess(user, pathname);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }),
        { numRuns: 100 }
      );
    });

    it('getRequiredPermission returns same result for same pathname', () => {
      fc.assert(
        fc.property(protectedPathArb, (pathname) => {
          const result1 = getRequiredPermission(pathname);
          const result2 = getRequiredPermission(pathname);
          
          expect(result1).toBe(result2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Page Permission Mapping', () => {
    it('/console/qc-inbox requires games:review', () => {
      expect(getRequiredPermission('/console/qc-inbox')).toBe('games:review');
    });

    it('/console/approval requires games:approve', () => {
      expect(getRequiredPermission('/console/approval')).toBe('games:approve');
    });

    it('/console/publish requires games:publish', () => {
      expect(getRequiredPermission('/console/publish')).toBe('games:publish');
    });

    it('/console/my-games requires games:view', () => {
      expect(getRequiredPermission('/console/my-games')).toBe('games:view');
    });

    it('/console/library requires games:view', () => {
      expect(getRequiredPermission('/console/library')).toBe('games:view');
    });

    it('/console (dashboard) allows any authenticated user', () => {
      expect(getRequiredPermission('/console')).toBe(null);
    });
  });

  describe('checkPageAccess', () => {
    const createUser = (roles: Role[]): User => ({
      _id: new ObjectId(),
      email: 'test@example.com',
      name: 'Test User',
      roles,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('allows QC user to access /console/qc-inbox', () => {
      const qcUser = createUser(['qc']);
      expect(checkPageAccess(qcUser, '/console/qc-inbox')).toBe(true);
    });

    it('denies dev user access to /console/qc-inbox', () => {
      const devUser = createUser(['dev']);
      expect(checkPageAccess(devUser, '/console/qc-inbox')).toBe(false);
    });

    it('allows CTO user to access /console/approval', () => {
      const ctoUser = createUser(['cto']);
      expect(checkPageAccess(ctoUser, '/console/approval')).toBe(true);
    });

    it('allows admin user to access any page', () => {
      const adminUser = createUser(['admin']);
      expect(checkPageAccess(adminUser, '/console/qc-inbox')).toBe(true);
      expect(checkPageAccess(adminUser, '/console/approval')).toBe(true);
      expect(checkPageAccess(adminUser, '/console/publish')).toBe(true);
    });

    it('allows any authenticated user to access /console', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          expect(checkPageAccess(user, '/console')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});


describe('Permission Injection', () => {
  /**
   * Feature: page-protection-flow, Property 5: All User Permissions Injected
   * Validates: Requirements 4.2
   */
  describe('Property 5: All User Permissions Injected', () => {
    it('getUserPermissions returns all permissions from all user roles', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const permissions = getUserPermissions(user);
          
          // For each role the user has, verify all role permissions are included
          for (const role of user.roles) {
            const rolePerms = ROLE_PERMISSIONS[role];
            for (const perm of rolePerms) {
              expect(permissions).toContain(perm);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('getUserPermissions returns unique permissions (no duplicates)', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const permissions = getUserPermissions(user);
          const uniquePermissions = new Set(permissions);
          
          expect(permissions.length).toBe(uniquePermissions.size);
        }),
        { numRuns: 100 }
      );
    });

    it('admin user has all permissions', () => {
      const adminUser: User = {
        _id: new ObjectId(),
        email: 'admin@test.com',
        name: 'Admin',
        roles: ['admin'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const permissions = getUserPermissions(adminUser);
      
      // Admin should have all permissions
      expect(permissions).toContain('games:view');
      expect(permissions).toContain('games:create');
      expect(permissions).toContain('games:update');
      expect(permissions).toContain('games:submit');
      expect(permissions).toContain('games:review');
      expect(permissions).toContain('games:approve');
      expect(permissions).toContain('games:publish');
    });
  });
});
