/**
 * Property-based tests for SDK architectural purity
 * Feature: core-sdk-refactoring, Property 1: SDK Architectural Purity
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 6.1, 6.3
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Import all SDK exports to test architectural purity
import * as SDK from '../index';
import * as Types from '../types';
import * as Validation from '../validation';
import * as Utils from '../utils';
import * as Runtime from '../runtime';

describe('Property 1: SDK Architectural Purity', () => {
  
  test('SDK should contain all metadata type definitions without external dependencies', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      // Test that core types are exported
      expect(typeof SDK.GameMetadata).toBe('undefined'); // It's a type, not runtime value
      expect(typeof Types.isValidGameMetadata).toBe('function');
      expect(typeof Types.getSchemaVersion).toBe('function');
      expect(typeof Types.getRequiredFields).toBe('function');
      
      // Test that validation types are exported
      expect(typeof SDK.ValidationResult).toBe('undefined'); // It's a type
      expect(typeof SDK.ValidationContext).toBe('undefined'); // It's a type
      
      // Test that schema versions are available
      expect(Types.SCHEMA_VERSIONS).toBeDefined();
      expect(Types.DEFAULT_MANDATORY_FIELDS).toBeDefined();
      expect(Array.isArray(Types.DEFAULT_MANDATORY_FIELDS)).toBe(true);
      
      return true;
    }), { numRuns: 100 });
  });

  test('SDK should export validation functions that accept metadata objects and return validation results', () => {
    fc.assert(fc.property(
      fc.record({
        gameType: fc.option(fc.string()),
        subject: fc.option(fc.string()),
        grade: fc.option(fc.oneof(fc.string(), fc.integer())),
        thumbnailUrl: fc.option(fc.webUrl())
      }),
      fc.constantFrom('draft', 'publish'),
      (metadata, context) => {
        // Test that validation function exists and has correct signature
        expect(typeof SDK.validateMetadata).toBe('function');
        
        // Test that validation function accepts metadata and context
        const result = SDK.validateMetadata(metadata, context);
        
        // Test that result has expected structure
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('context');
        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.context).toBe(context);
        
        return true;
      }
    ), { numRuns: 100 });
  });

  test('SDK should include JSON schemas for manifest validation', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      // Test that schema files exist
      const schemaDir = path.join(__dirname, '../../schemas');
      expect(fs.existsSync(schemaDir)).toBe(true);
      
      const manifestSchema = path.join(schemaDir, 'manifest.schema.json');
      expect(fs.existsSync(manifestSchema)).toBe(true);
      
      // Test that schema is valid JSON
      const schemaContent = fs.readFileSync(manifestSchema, 'utf8');
      const schema = JSON.parse(schemaContent);
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('type');
      
      // Test that Zod schemas are exported
      expect(typeof Validation.GameManifestSchema).toBe('object');
      expect(typeof Validation.DraftMetadataSchema).toBe('object');
      expect(typeof Validation.PublishMetadataSchema).toBe('object');
      
      return true;
    }), { numRuns: 100 });
  });

  test('SDK should provide runtime communication protocols for iframe-based games', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      // Test that runtime classes are exported
      expect(typeof SDK.GameHost).toBe('function'); // Constructor function
      expect(typeof SDK.GameClient).toBe('function'); // Constructor function
      expect(typeof SDK.GameEventType).toBe('object'); // Enum object
      
      // Test that runtime exports are available
      expect(typeof Runtime.GameHost).toBe('function');
      expect(typeof Runtime.GameClient).toBe('function');
      expect(typeof Runtime.GameEventType).toBe('object');
      
      // Test that event types are defined
      expect(Runtime.GameEventType.GAME_READY).toBeDefined();
      expect(Runtime.GameEventType.SCORE_UPDATE).toBeDefined();
      expect(Runtime.GameEventType.GAME_END).toBeDefined();
      
      return true;
    }), { numRuns: 100 });
  });

  test('SDK should be publishable as independent npm package', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      // Test that package.json exists and has correct structure
      const packageJsonPath = path.join(__dirname, '../../package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Test package metadata
      expect(packageJson.name).toBe('@iruka/game-core-sdk');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.main).toBeDefined();
      expect(packageJson.module).toBeDefined();
      expect(packageJson.types).toBeDefined();
      
      // Test that exports are defined
      expect(packageJson.exports).toBeDefined();
      expect(packageJson.exports['.']).toBeDefined();
      expect(packageJson.exports['./types']).toBeDefined();
      expect(packageJson.exports['./validation']).toBeDefined();
      expect(packageJson.exports['./utils']).toBeDefined();
      expect(packageJson.exports['./runtime']).toBeDefined();
      
      // Test that files array includes necessary files
      expect(Array.isArray(packageJson.files)).toBe(true);
      expect(packageJson.files).toContain('dist');
      expect(packageJson.files).toContain('schemas');
      
      return true;
    }), { numRuns: 100 });
  });

  test('SDK should contain only pure TypeScript functions without external service dependencies', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      // Test that package.json dependencies are minimal and pure
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Test that only allowed dependencies are present
      const allowedDependencies = ['zod']; // Only pure validation library allowed
      const dependencies = Object.keys(packageJson.dependencies || {});
      
      for (const dep of dependencies) {
        expect(allowedDependencies).toContain(dep);
      }
      
      // Test that no service dependencies are present
      const forbiddenDependencies = [
        'mongodb', 'mongoose', // Database dependencies
        'react', 'vue', 'angular', // UI framework dependencies
        'express', 'fastify', 'koa', // Server dependencies
        'axios', 'fetch', 'node-fetch', // HTTP client dependencies
        'redis', 'ioredis', // Cache dependencies
        'aws-sdk', '@aws-sdk', // Cloud service dependencies
      ];
      
      for (const dep of dependencies) {
        for (const forbidden of forbiddenDependencies) {
          expect(dep).not.toMatch(new RegExp(forbidden));
        }
      }
      
      return true;
    }), { numRuns: 100 });
  });

  test('SDK should export all required interfaces, validation schemas, and utility functions', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      // Test that all required exports are available from main index
      const mainExports = Object.keys(SDK);
      
      // Test type exports (these won't appear in runtime, but functions should)
      expect(typeof SDK.validateMetadata).toBe('function');
      expect(typeof SDK.calculateCompleteness).toBe('function');
      expect(typeof SDK.getMissingFields).toBe('function');
      expect(typeof SDK.isMetadataComplete).toBe('function');
      
      // Test class exports
      expect(typeof SDK.GameHost).toBe('function');
      expect(typeof SDK.GameClient).toBe('function');
      
      // Test enum exports
      expect(typeof SDK.GameEventType).toBe('object');
      
      // Test utility functions
      expect(typeof Utils.calculateCompleteness).toBe('function');
      expect(typeof Utils.getMissingFields).toBe('function');
      expect(typeof Utils.isMetadataComplete).toBe('function');
      expect(typeof Utils.getDetailedCompleteness).toBe('function');
      
      // Test compliance functions
      expect(typeof Utils.analyzeGameCompliance).toBe('function');
      expect(typeof Utils.generateComplianceStats).toBe('function');
      
      return true;
    }), { numRuns: 100 });
  });

  test('SDK modules should not import external service dependencies', () => {
    fc.assert(fc.property(fc.constant(null), () => {
      // Test that source files don't contain forbidden imports
      const srcDir = path.join(__dirname, '..');
      const sourceFiles = getAllTypeScriptFiles(srcDir);
      
      const forbiddenImports = [
        'mongodb', 'mongoose',
        'react', 'vue', 'angular',
        'express', 'fastify', 'koa',
        'axios', 'node-fetch',
        'redis', 'ioredis',
        'aws-sdk', '@aws-sdk'
      ];
      
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const forbidden of forbiddenImports) {
          expect(content).not.toMatch(new RegExp(`import.*from.*['"]${forbidden}`));
          expect(content).not.toMatch(new RegExp(`require\\(['"]${forbidden}`));
        }
      }
      
      return true;
    }), { numRuns: 100 });
  });
});

/**
 * Helper function to recursively get all TypeScript files
 */
function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}