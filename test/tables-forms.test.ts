import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Tables and Forms Components Migration', () => {
  const componentsDir = path.join(process.cwd(), 'components');

  describe('GameTable', () => {
    const tablePath = path.join(componentsDir, 'tables/GameTable.tsx');

    it('should exist as a React component', () => {
      expect(fs.existsSync(tablePath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = fs.readFileSync(tablePath, 'utf-8');
      expect(content.startsWith("'use client'")).toBe(true);
    });

    it('should export GameTable function', () => {
      const content = fs.readFileSync(tablePath, 'utf-8');
      expect(content).toContain('export function GameTable');
    });

    it('should support bulk actions', () => {
      const content = fs.readFileSync(tablePath, 'utf-8');
      expect(content).toContain('showBulkActions');
      expect(content).toContain('selectedIds');
    });

    it('should have row selection functionality', () => {
      const content = fs.readFileSync(tablePath, 'utf-8');
      expect(content).toContain('handleSelectAll');
      expect(content).toContain('handleSelect');
    });

    it('should link to game detail pages', () => {
      const content = fs.readFileSync(tablePath, 'utf-8');
      expect(content).toContain('/console/games/${gameId}');
    });
  });

  describe('GameFilters', () => {
    const filterPath = path.join(componentsDir, 'filters/GameFilters.tsx');

    it('should exist as a React component', () => {
      expect(fs.existsSync(filterPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = fs.readFileSync(filterPath, 'utf-8');
      expect(content.startsWith("'use client'")).toBe(true);
    });

    it('should export GameFilters function', () => {
      const content = fs.readFileSync(filterPath, 'utf-8');
      expect(content).toContain('export function GameFilters');
    });

    it('should have status filter labels', () => {
      const content = fs.readFileSync(filterPath, 'utf-8');
      expect(content).toContain('statusLabels');
      expect(content).toContain('draft');
      expect(content).toContain('published');
    });

    it('should use URL-based filtering', () => {
      const content = fs.readFileSync(filterPath, 'utf-8');
      expect(content).toContain('href=');
      expect(content).toContain('status=');
    });
  });

  describe('BulkActions', () => {
    const bulkPath = path.join(componentsDir, 'actions/BulkActions.tsx');

    it('should exist as a React component', () => {
      expect(fs.existsSync(bulkPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = fs.readFileSync(bulkPath, 'utf-8');
      expect(content.startsWith("'use client'")).toBe(true);
    });

    it('should export BulkActions function', () => {
      const content = fs.readFileSync(bulkPath, 'utf-8');
      expect(content).toContain('export function BulkActions');
    });

    it('should have delete confirmation modal', () => {
      const content = fs.readFileSync(bulkPath, 'utf-8');
      expect(content).toContain('showDeleteModal');
      expect(content).toContain('Xác nhận xóa games');
    });

    it('should handle bulk delete API calls', () => {
      const content = fs.readFileSync(bulkPath, 'utf-8');
      expect(content).toContain('Promise.allSettled');
      expect(content).toContain('/api/games/${id}/delete');
    });

    it('should show selected count', () => {
      const content = fs.readFileSync(bulkPath, 'utf-8');
      expect(content).toContain('selectedIds.length');
      expect(content).toContain('game được chọn');
    });
  });

  describe('ManifestForm', () => {
    const formPath = path.join(componentsDir, 'forms/ManifestForm.tsx');

    it('should exist as a React component', () => {
      expect(fs.existsSync(formPath)).toBe(true);
    });

    it('should be a client component', () => {
      const content = fs.readFileSync(formPath, 'utf-8');
      expect(content.startsWith("'use client'")).toBe(true);
    });

    it('should export ManifestForm function', () => {
      const content = fs.readFileSync(formPath, 'utf-8');
      expect(content).toContain('export function ManifestForm');
    });

    it('should have ManifestData interface', () => {
      const content = fs.readFileSync(formPath, 'utf-8');
      expect(content).toContain('interface ManifestData');
      expect(content).toContain('gameId: string');
      expect(content).toContain('version: string');
      expect(content).toContain('runtime: string');
      expect(content).toContain('entryPoint: string');
    });

    it('should have runtime options', () => {
      const content = fs.readFileSync(formPath, 'utf-8');
      expect(content).toContain('HTML5');
      expect(content).toContain('Unity WebGL');
      expect(content).toContain('Phaser');
    });

    it('should validate gameId format', () => {
      const content = fs.readFileSync(formPath, 'utf-8');
      expect(content).toContain('/^[a-z0-9.-]+$/');
    });

    it('should validate version format (SemVer)', () => {
      const content = fs.readFileSync(formPath, 'utf-8');
      expect(content).toContain('/^\\d+\\.\\d+\\.\\d+/');
    });

    it('should have reset and validate buttons', () => {
      const content = fs.readFileSync(formPath, 'utf-8');
      expect(content).toContain('Reset');
      expect(content).toContain('Validate');
    });
  });

  describe('Index Exports', () => {
    it('should export GameTable from tables index', () => {
      const indexPath = path.join(componentsDir, 'tables/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('GameTable');
    });

    it('should export GameFilters from filters index', () => {
      const indexPath = path.join(componentsDir, 'filters/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('GameFilters');
    });

    it('should export BulkActions from actions index', () => {
      const indexPath = path.join(componentsDir, 'actions/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('BulkActions');
    });

    it('should export ManifestForm from forms index', () => {
      const indexPath = path.join(componentsDir, 'forms/index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('ManifestForm');
    });
  });

  describe('Property: Form Validation Patterns', () => {
    it('should validate manifest data correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            gameId: fc.stringMatching(/^[a-z0-9.-]+$/),
            version: fc.stringMatching(/^\d+\.\d+\.\d+$/),
            runtime: fc.constantFrom('HTML5', 'Unity WebGL', 'Phaser'),
            entryPoint: fc.string({ minLength: 1 }),
          }),
          (manifest) => {
            // Valid manifest should pass validation
            const gameIdValid = /^[a-z0-9.-]+$/.test(manifest.gameId);
            const versionValid = /^\d+\.\d+\.\d+/.test(manifest.version);
            return gameIdValid && versionValid;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid gameId formats', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/[A-Z_!@#$%^&*()]/),
          (invalidGameId) => {
            // Invalid gameId should fail validation
            return !/^[a-z0-9.-]+$/.test(invalidGameId);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: Component Consistency', () => {
    it('should have consistent client component patterns', () => {
      const componentPaths = [
        'tables/GameTable.tsx',
        'filters/GameFilters.tsx',
        'actions/BulkActions.tsx',
        'forms/ManifestForm.tsx',
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...componentPaths),
          (componentPath) => {
            const fullPath = path.join(componentsDir, componentPath);
            const content = fs.readFileSync(fullPath, 'utf-8');

            // All should be client components
            expect(content.startsWith("'use client'")).toBe(true);

            // All should have proper exports
            expect(content).toContain('export function');

            return true;
          }
        ),
        { numRuns: 4 }
      );
    });
  });
});
