import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ObjectId } from 'mongodb';
import { createClientAuth, canDo } from './client-auth';
import type { User, Role } from '../models/User';
import type { Permission } from '../auth/auth-rbac';

// Generators
const roleArb = fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin');
const permissionArb = fc.constantFrom<Permission>(
  'games:view',
  'games:create',
  'games:update',
  'games:submit',
  'games:review',
  'games:approve',
  'games:publish'
);

const userArb = fc.record({
  _id: fc.constant(new ObjectId()),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  roles: fc.array(roleArb, { minLength: 1, maxLength: 3 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<User>;

const permissionsArb = fc.array(permissionArb, { minLength: 0, maxLength: 7 });

describe('Client Auth Helper', () => {
  /**
   * Feature: page-protection-flow, Property 6: Client Permission Helper Consistency
   * Validates: Requirements 4.3
   */
  describe('Property 6: Client Permission Helper Consistency', () => {
    it('can() returns true if and only if permission is in permissions array', () => {
      fc.assert(
        fc.property(userArb, permissionsArb, permissionArb, (user, permissions, permission) => {
          const auth = createClientAuth(user, permissions);
          const result = auth.can(permission);
          const expected = permissions.includes(permission);
          
          expect(result).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('canDo() returns true if and only if permission is in permissions array', () => {
      fc.assert(
        fc.property(permissionsArb, permissionArb, (permissions, permission) => {
          const result = canDo(permissions, permission);
          const expected = permissions.includes(permission);
          
          expect(result).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('can() is deterministic - same inputs always return same result', () => {
      fc.assert(
        fc.property(userArb, permissionsArb, permissionArb, (user, permissions, permission) => {
          const auth = createClientAuth(user, permissions);
          
          const result1 = auth.can(permission);
          const result2 = auth.can(permission);
          const result3 = auth.can(permission);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('createClientAuth', () => {
    it('returns object with user, permissions, and can function', () => {
      const user: User = {
        _id: new ObjectId(),
        email: 'test@example.com',
        name: 'Test',
        roles: ['dev'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const permissions: Permission[] = ['games:view', 'games:create'];
      
      const auth = createClientAuth(user, permissions);
      
      expect(auth.user).toBe(user);
      expect(auth.permissions).toBe(permissions);
      expect(typeof auth.can).toBe('function');
    });

    it('can() returns true for included permission', () => {
      const user: User = {
        _id: new ObjectId(),
        email: 'test@example.com',
        name: 'Test',
        roles: ['dev'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const permissions: Permission[] = ['games:view', 'games:create'];
      
      const auth = createClientAuth(user, permissions);
      
      expect(auth.can('games:view')).toBe(true);
      expect(auth.can('games:create')).toBe(true);
    });

    it('can() returns false for excluded permission', () => {
      const user: User = {
        _id: new ObjectId(),
        email: 'test@example.com',
        name: 'Test',
        roles: ['dev'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const permissions: Permission[] = ['games:view', 'games:create'];
      
      const auth = createClientAuth(user, permissions);
      
      expect(auth.can('games:publish')).toBe(false);
      expect(auth.can('games:approve')).toBe(false);
    });
  });
});
