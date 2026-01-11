import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Remaining API Routes Migration', () => {
  const apiDir = path.join(process.cwd(), 'app/api');

  describe('User Management APIs', () => {
    it('should have users list/create route', () => {
      const routePath = path.join(apiDir, 'users/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain('export async function GET');
      expect(content).toContain('export async function POST');
      expect(content).toContain('UserRepository');
    });

    it('should have users [id] route for update/delete', () => {
      const routePath = path.join(apiDir, 'users/[id]/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain('export async function PUT');
      expect(content).toContain('export async function DELETE');
    });

    it('should check admin/cto permissions for user management', () => {
      const routePath = path.join(apiDir, 'users/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');
      
      expect(content).toContain("roles.includes('admin')");
      expect(content).toContain("roles.includes('cto')");
    });

    it('should prevent self-deletion', () => {
      const routePath = path.join(apiDir, 'users/[id]/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');
      
      expect(content).toContain('Cannot delete your own account');
    });
  });

  describe('QC Workflow APIs', () => {
    it('should have qc/run route', () => {
      const routePath = path.join(apiDir, 'qc/run/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain('export async function POST');
      expect(content).toContain('TestRunnerService');
    });

    it('should have qc/decision route', () => {
      const routePath = path.join(apiDir, 'qc/decision/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain('export async function POST');
      expect(content).toContain('QCReportRepository');
    });

    it('should check games:review permission', () => {
      const runPath = path.join(apiDir, 'qc/run/route.ts');
      const decisionPath = path.join(apiDir, 'qc/decision/route.ts');
      
      const runContent = fs.readFileSync(runPath, 'utf-8');
      const decisionContent = fs.readFileSync(decisionPath, 'utf-8');
      
      expect(runContent).toContain("hasPermissionString(user, 'games:review')");
      expect(decisionContent).toContain("hasPermissionString(user, 'games:review')");
    });

    it('should validate QA test results before passing', () => {
      const routePath = path.join(apiDir, 'qc/decision/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');
      
      expect(content).toContain('qa01Pass');
      expect(content).toContain('qa02Pass');
      expect(content).toContain('qa04Pass');
      expect(content).toContain('Cannot pass QC when QA-01 or QA-02 tests failed');
    });
  });

  describe('Admin APIs', () => {
    it('should have admin/sync-from-gcs route', () => {
      const routePath = path.join(apiDir, 'admin/sync-from-gcs/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain('export async function POST');
      expect(content).toContain('RegistryManager');
    });

    it('should support dry run mode', () => {
      const routePath = path.join(apiDir, 'admin/sync-from-gcs/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');
      
      expect(content).toContain('dryRun');
      expect(content).toContain('[DRY RUN]');
    });

    it('should check admin permission', () => {
      const routePath = path.join(apiDir, 'admin/sync-from-gcs/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');
      
      expect(content).toContain("roles.includes('admin')");
    });
  });

  describe('GCS Management APIs', () => {
    it('should have gcs/files route', () => {
      const routePath = path.join(apiDir, 'gcs/files/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain('export async function GET');
      expect(content).toContain('Storage');
    });

    it('should have gcs/cleanup route', () => {
      const routePath = path.join(apiDir, 'gcs/cleanup/route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain('export async function POST');
    });

    it('should use caching for GCS files', () => {
      const routePath = path.join(apiDir, 'gcs/files/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');
      
      expect(content).toContain('gcsCache');
      expect(content).toContain('forceRefresh');
    });

    it('should check admin permission for GCS operations', () => {
      const filesPath = path.join(apiDir, 'gcs/files/route.ts');
      const cleanupPath = path.join(apiDir, 'gcs/cleanup/route.ts');
      
      const filesContent = fs.readFileSync(filesPath, 'utf-8');
      const cleanupContent = fs.readFileSync(cleanupPath, 'utf-8');
      
      expect(filesContent).toContain("roles.includes('admin')");
      expect(cleanupContent).toContain("roles.includes('admin')");
    });
  });

  describe('Property: API Route Patterns', () => {
    it('should follow consistent Next.js route handler patterns', () => {
      const routes = [
        'users/route.ts',
        'users/[id]/route.ts',
        'qc/run/route.ts',
        'qc/decision/route.ts',
        'gcs/files/route.ts',
        'gcs/cleanup/route.ts',
        'admin/sync-from-gcs/route.ts',
      ];

      fc.assert(
        fc.property(fc.constantFrom(...routes), (routePath) => {
          const fullPath = path.join(apiDir, routePath);
          const content = fs.readFileSync(fullPath, 'utf-8');

          // All routes should use NextRequest/NextResponse
          expect(content).toContain('NextRequest');
          expect(content).toContain('NextResponse');

          // All routes should use getUserFromHeaders
          expect(content).toContain('getUserFromHeaders');

          return true;
        }),
        { numRuns: 7 }
      );
    });
  });

  describe('Property: Error Handling', () => {
    it('should have consistent error response patterns', () => {
      const routes = [
        'users/route.ts',
        'qc/run/route.ts',
        'qc/decision/route.ts',
        'gcs/files/route.ts',
      ];

      fc.assert(
        fc.property(fc.constantFrom(...routes), (routePath) => {
          const fullPath = path.join(apiDir, routePath);
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Should handle unauthorized
          expect(content).toContain('Unauthorized');
          expect(content).toContain('status: 401');

          // Should handle forbidden
          expect(content).toContain('Forbidden');
          expect(content).toContain('status: 403');

          return true;
        }),
        { numRuns: 4 }
      );
    });
  });
});
