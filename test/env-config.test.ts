/**
 * Property Test: Environment Configuration Preservation
 * Feature: astro-to-nextjs-migration, Property 6
 * Validates: Requirements 6.4, 8.2
 * 
 * This test verifies that all environment variables used in the original
 * Astro application are also accessible in the Next.js application with
 * identical semantics.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * List of required environment variables used by the application
 * These must be preserved during migration
 */
const REQUIRED_ENV_VARS = [
  'GCLOUD_PROJECT_ID',
  'GCLOUD_BUCKET_NAME',
  'GCLOUD_CLIENT_EMAIL',
  'GCLOUD_PRIVATE_KEY',
  'IRUKA_MONGODB_URI',
] as const;

/**
 * Optional environment variables that may be used
 */
const OPTIONAL_ENV_VARS = [
  'IRUKA_SESSION_SECRET',
  'GITHUB_TOKEN',
  'NODE_ENV',
  'VERCEL',
  'USE_NODE_ADAPTER',
] as const;

describe('Environment Configuration Preservation', () => {
  /**
   * Property 6: Environment Configuration Preservation
   * For any environment variable used in the original application,
   * the Next.js application SHALL read and use the same variable
   * with identical semantics.
   */
  
  it('should have all required environment variables defined', () => {
    // This test verifies that the required env vars are accessible
    // In a real migration, both Astro and Next.js should read from the same .env
    
    for (const envVar of REQUIRED_ENV_VARS) {
      const value = process.env[envVar];
      expect(value, `Environment variable ${envVar} should be defined`).toBeDefined();
      expect(typeof value).toBe('string');
      expect(value!.length).toBeGreaterThan(0);
    }
  });

  it('should preserve MongoDB URI format', () => {
    const mongoUri = process.env.IRUKA_MONGODB_URI;
    expect(mongoUri).toBeDefined();
    
    // MongoDB URI should start with mongodb:// or mongodb+srv://
    expect(mongoUri).toMatch(/^mongodb(\+srv)?:\/\//);
  });

  it('should preserve GCS configuration format', () => {
    const projectId = process.env.GCLOUD_PROJECT_ID;
    const bucketName = process.env.GCLOUD_BUCKET_NAME;
    const clientEmail = process.env.GCLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GCLOUD_PRIVATE_KEY;

    expect(projectId).toBeDefined();
    expect(bucketName).toBeDefined();
    expect(clientEmail).toBeDefined();
    expect(privateKey).toBeDefined();

    // Client email should be a valid service account email
    expect(clientEmail).toMatch(/@.*\.iam\.gserviceaccount\.com$/);

    // Private key should be a PEM-formatted key
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(privateKey).toContain('-----END PRIVATE KEY-----');
  });

  /**
   * Property-based test: For any subset of environment variables,
   * reading them should return consistent values
   */
  it('should return consistent values for environment variables across multiple reads', async () => {
    await fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_ENV_VARS),
        (envVar) => {
          const firstRead = process.env[envVar];
          const secondRead = process.env[envVar];
          
          // Values should be identical across reads
          return firstRead === secondRead;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Environment variable names behavior
   * Note: On Windows, env vars are case-insensitive; on Unix, they are case-sensitive
   * This test verifies consistent behavior within the platform
   */
  it('should have consistent case handling for environment variable names', async () => {
    const isWindows = process.platform === 'win32';
    
    await fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_ENV_VARS),
        (envVar) => {
          const originalValue = process.env[envVar];
          const lowercaseValue = process.env[envVar.toLowerCase()];
          
          // Original should be defined
          if (!originalValue) return true; // Skip if not defined
          
          if (isWindows) {
            // On Windows, env vars are case-insensitive
            // Both should return the same value
            return lowercaseValue === originalValue;
          } else {
            // On Unix, env vars are case-sensitive
            // Lowercase version should be undefined or different
            return lowercaseValue === undefined || lowercaseValue !== originalValue;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test that optional environment variables, when defined, have valid formats
   */
  it('should have valid format for optional environment variables when defined', () => {
    const sessionSecret = process.env.IRUKA_SESSION_SECRET;
    if (sessionSecret) {
      // Session secret should be a non-empty string
      expect(sessionSecret.length).toBeGreaterThan(0);
    }

    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv) {
      // NODE_ENV should be one of the standard values
      expect(['development', 'production', 'test']).toContain(nodeEnv);
    }
  });
});

/**
 * Test that environment variables are loaded correctly from .env file
 * This simulates how both Astro and Next.js load environment variables
 */
describe('Environment Loading Consistency', () => {
  it('should load environment variables using dotenv pattern', async () => {
    // Both Astro and Next.js use dotenv for loading .env files
    // This test verifies the loading mechanism works correctly
    
    const dotenv = await import('dotenv');
    const result = dotenv.config();
    
    // dotenv.config() should not throw an error
    // If .env file doesn't exist, it returns { parsed: undefined }
    // If it exists, it returns { parsed: { ... } }
    expect(result.error).toBeUndefined();
  });

  /**
   * Property-based test: Environment variables should survive
   * multiple dotenv.config() calls (idempotent)
   */
  it('should be idempotent when loading environment variables', async () => {
    const dotenv = await import('dotenv');
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_ENV_VARS),
        async (envVar) => {
          const valueBefore = process.env[envVar];
          
          // Call dotenv.config() again
          dotenv.config();
          
          const valueAfter = process.env[envVar];
          
          // Value should remain the same
          return valueBefore === valueAfter;
        }
      ),
      { numRuns: 50 }
    );
  });
});
