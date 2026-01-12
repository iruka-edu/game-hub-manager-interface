import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Property tests for Astro code removal
 * Feature: astro-code-removal
 * 
 * These tests verify that the Astro cleanup was complete and correct.
 */

describe('Astro Code Removal', () => {
  const projectRoot = process.cwd();

  /**
   * Helper function to recursively get all files in a directory
   */
  function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    if (!fs.existsSync(dirPath)) {
      return arrayOfFiles;
    }

    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        // Skip build/cache directories
        const excludeDirs = ['node_modules', '.next', '.git', '.vercel', 'dist'];
        if (!excludeDirs.includes(file)) {
          getAllFiles(fullPath, arrayOfFiles);
        }
      } else {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }

  describe('Property 1: No Astro Files Remain', () => {
    /**
     * Property 1: No Astro Files Remain
     * *For any* file path in the project after cleanup, if the file has a `.astro` extension, then it should not exist.
     * **Validates: Requirements 1.1-1.7, 3.1, 3.2**
     */
    it('should have no .astro files in the project', () => {
      const allFiles = getAllFiles(projectRoot);
      const astroFiles = allFiles.filter((file) => file.endsWith('.astro'));

      expect(astroFiles).toHaveLength(0);
      
      if (astroFiles.length > 0) {
        console.log('Found .astro files:', astroFiles);
      }
    });

    it('should have no .astro files in src directory', () => {
      const srcDir = path.join(projectRoot, 'src');
      const allFiles = getAllFiles(srcDir);
      const astroFiles = allFiles.filter((file) => file.endsWith('.astro'));

      expect(astroFiles).toHaveLength(0);
    });

    it('should not have src/pages directory (Astro routing)', () => {
      const srcPagesDir = path.join(projectRoot, 'src', 'pages');
      expect(fs.existsSync(srcPagesDir)).toBe(false);
    });

    it('should not have src/layouts directory (Astro layouts)', () => {
      const srcLayoutsDir = path.join(projectRoot, 'src', 'layouts');
      expect(fs.existsSync(srcLayoutsDir)).toBe(false);
    });

    it('should not have astro.config.mjs', () => {
      const astroConfig = path.join(projectRoot, 'astro.config.mjs');
      expect(fs.existsSync(astroConfig)).toBe(false);
    });

    it('should not have .astro directory', () => {
      const astroCacheDir = path.join(projectRoot, '.astro');
      expect(fs.existsSync(astroCacheDir)).toBe(false);
    });

    it('should not have src/env.d.ts (Astro types)', () => {
      const envDts = path.join(projectRoot, 'src', 'env.d.ts');
      expect(fs.existsSync(envDts)).toBe(false);
    });
  });


  describe('Property 2: No Astro Dependencies', () => {
    /**
     * Property 2: No Astro Dependencies
     * *For any* dependency listed in `package.json` after cleanup, the dependency name should not start with `astro` or `@astrojs/`.
     * **Validates: Requirements 5.1-5.4**
     */
    it('should have no Astro dependencies in package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      const allDeps = [...dependencies, ...devDependencies];

      const astroDeps = allDeps.filter(
        (dep) => dep === 'astro' || dep.startsWith('@astrojs/')
      );

      expect(astroDeps).toHaveLength(0);

      if (astroDeps.length > 0) {
        console.log('Found Astro dependencies:', astroDeps);
      }
    });

    it('should use property-based testing to verify no Astro deps', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      const allDeps = [...dependencies, ...devDependencies];

      fc.assert(
        fc.property(fc.constantFrom(...allDeps), (dep) => {
          // No dependency should be 'astro' or start with '@astrojs/'
          expect(dep).not.toBe('astro');
          expect(dep.startsWith('@astrojs/')).toBe(false);
          return true;
        }),
        { numRuns: allDeps.length }
      );
    });

    it('should have Next.js as the framework dependency', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.dependencies).toHaveProperty('next');
      expect(packageJson.dependencies).toHaveProperty('react');
      expect(packageJson.dependencies).toHaveProperty('react-dom');
    });

    it('should have Next.js scripts configured', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts.dev).toBe('next dev');
      expect(packageJson.scripts.build).toBe('next build');
      expect(packageJson.scripts.start).toBe('next start');
      expect(packageJson.scripts.lint).toBe('next lint');
    });

    it('should not have Astro-specific scripts', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const scripts = packageJson.scripts || {};
      const scriptValues = Object.values(scripts) as string[];

      // No script should contain 'astro' command
      const astroScripts = scriptValues.filter(
        (script) => script.includes('astro ')
      );

      expect(astroScripts).toHaveLength(0);
    });
  });

  describe('Property 3: Shared Code Preservation', () => {
    /**
     * Property 3: Shared Code Preservation
     * *For any* file in the preserved directories (`src/lib/`, `src/models/`, `src/auth/`, `src/services/`, `src/types/`, `src/utils/`, `src/styles/`, `src/scripts/`), the file should exist.
     * **Validates: Requirements 9.1-9.8**
     */
    const preservedDirs = [
      'src/lib',
      'src/models',
      'src/auth',
      'src/services',
      'src/types',
      'src/utils',
      'src/styles',
      'src/scripts',
    ];

    it('should preserve all shared code directories', () => {
      fc.assert(
        fc.property(fc.constantFrom(...preservedDirs), (dir) => {
          const dirPath = path.join(projectRoot, dir);
          expect(fs.existsSync(dirPath)).toBe(true);
          return true;
        }),
        { numRuns: preservedDirs.length }
      );
    });

    it('should preserve src/lib directory with key files', () => {
      const libDir = path.join(projectRoot, 'src/lib');
      expect(fs.existsSync(libDir)).toBe(true);

      const keyFiles = [
        'mongodb.ts',
        'gcs.ts',
        'session.ts',
        'validator.ts',
        'version-state-machine.ts',
      ];

      keyFiles.forEach((file) => {
        const filePath = path.join(libDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should preserve src/models directory with all models', () => {
      const modelsDir = path.join(projectRoot, 'src/models');
      expect(fs.existsSync(modelsDir)).toBe(true);

      const modelFiles = [
        'Game.ts',
        'GameVersion.ts',
        'User.ts',
        'QcReport.ts',
        'Notification.ts',
      ];

      modelFiles.forEach((file) => {
        const filePath = path.join(modelsDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should preserve src/auth directory with RBAC/ABAC', () => {
      const authDir = path.join(projectRoot, 'src/auth');
      expect(fs.existsSync(authDir)).toBe(true);

      const authFiles = ['auth-rbac.ts', 'auth-abac.ts', 'deletion-rules.ts'];

      authFiles.forEach((file) => {
        const filePath = path.join(authDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should preserve src/services directory', () => {
      const servicesDir = path.join(projectRoot, 'src/services');
      expect(fs.existsSync(servicesDir)).toBe(true);

      const serviceFiles = ['TestRunnerService.ts'];

      serviceFiles.forEach((file) => {
        const filePath = path.join(servicesDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should preserve src/types directory', () => {
      const typesDir = path.join(projectRoot, 'src/types');
      expect(fs.existsSync(typesDir)).toBe(true);

      const typeFiles = ['user-types.ts', 'qc-types.ts', 'upload-types.ts'];

      typeFiles.forEach((file) => {
        const filePath = path.join(typesDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should preserve src/styles directory', () => {
      const stylesDir = path.join(projectRoot, 'src/styles');
      expect(fs.existsSync(stylesDir)).toBe(true);

      const styleFiles = ['global.css', 'tailwind.css'];

      styleFiles.forEach((file) => {
        const filePath = path.join(stylesDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should preserve Next.js app directory', () => {
      const appDir = path.join(projectRoot, 'app');
      expect(fs.existsSync(appDir)).toBe(true);

      // Key Next.js files
      const keyFiles = ['layout.tsx', 'page.tsx'];

      keyFiles.forEach((file) => {
        const filePath = path.join(appDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should preserve Next.js middleware', () => {
      const middlewarePath = path.join(projectRoot, 'middleware.ts');
      expect(fs.existsSync(middlewarePath)).toBe(true);

      const content = fs.readFileSync(middlewarePath, 'utf-8');
      expect(content).toContain('NextResponse');
      expect(content).toContain('NextRequest');
    });

    it('should preserve React components directory', () => {
      const componentsDir = path.join(projectRoot, 'components');
      expect(fs.existsSync(componentsDir)).toBe(true);

      // Should have subdirectories for organized components
      const subdirs = fs.readdirSync(componentsDir);
      expect(subdirs.length).toBeGreaterThan(0);
    });
  });

  describe('Property 4: No Astro Imports in Codebase', () => {
    /**
     * Additional property: No code should import from Astro
     */
    it('should have no imports from astro in TypeScript files', () => {
      const srcDir = path.join(projectRoot, 'src');
      const appDir = path.join(projectRoot, 'app');
      const componentsDir = path.join(projectRoot, 'components');

      const allFiles = [
        ...getAllFiles(srcDir),
        ...getAllFiles(appDir),
        ...getAllFiles(componentsDir),
      ].filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

      const filesWithAstroImports: string[] = [];

      allFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        if (
          content.includes("from 'astro'") ||
          content.includes('from "astro"') ||
          content.includes("from '@astrojs/") ||
          content.includes('from "@astrojs/')
        ) {
          filesWithAstroImports.push(file);
        }
      });

      expect(filesWithAstroImports).toHaveLength(0);

      if (filesWithAstroImports.length > 0) {
        console.log('Files with Astro imports:', filesWithAstroImports);
      }
    });
  });
});
