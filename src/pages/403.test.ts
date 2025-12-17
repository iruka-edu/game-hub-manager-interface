import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Role } from '../models/User';

// Role labels mapping (same as in 403.astro)
const roleLabels: Record<string, string> = {
  dev: 'Developer',
  qc: 'QC Tester', 
  cto: 'CTO',
  ceo: 'CEO',
  admin: 'Administrator'
};

/**
 * Function to generate role display string (same logic as 403.astro)
 */
function getUserRoleDisplay(roles: Role[]): string {
  return roles.map(r => roleLabels[r] || r).join(', ') || 'Không xác định';
}

// Generators
const roleArb = fc.constantFrom<Role>('dev', 'qc', 'cto', 'ceo', 'admin');

describe('403 Page Logic', () => {
  /**
   * Feature: page-protection-flow, Property 2: 403 Page Shows User Role
   * Validates: Requirements 1.3
   */
  describe('Property 2: 403 Page Shows User Role', () => {
    it('role display contains all user roles', () => {
      fc.assert(
        fc.property(
          fc.array(roleArb, { minLength: 1, maxLength: 3 }),
          (roles) => {
            const display = getUserRoleDisplay(roles);
            
            // Each role should be represented in the display
            for (const role of roles) {
              const expectedLabel = roleLabels[role];
              expect(display).toContain(expectedLabel);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('role display is deterministic', () => {
      fc.assert(
        fc.property(
          fc.array(roleArb, { minLength: 1, maxLength: 3 }),
          (roles) => {
            const display1 = getUserRoleDisplay(roles);
            const display2 = getUserRoleDisplay(roles);
            
            expect(display1).toBe(display2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty roles returns default message', () => {
      const display = getUserRoleDisplay([]);
      expect(display).toBe('Không xác định');
    });
  });

  describe('Role Labels', () => {
    it('all valid roles have labels', () => {
      const validRoles: Role[] = ['dev', 'qc', 'cto', 'ceo', 'admin'];
      for (const role of validRoles) {
        expect(roleLabels[role]).toBeDefined();
        expect(roleLabels[role].length).toBeGreaterThan(0);
      }
    });
  });
});
