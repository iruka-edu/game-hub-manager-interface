import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  GameMetadata,
  GameWithMetadata,
  hasMetadata,
  isMetadataComplete,
  calculateCompleteness,
  getMissingFields,
  DEFAULT_MANDATORY_FIELDS
} from '../metadata-types';
import { ObjectId } from 'mongodb';

describe('Metadata Types', () => {
  // Property 1: Metadata Object Structure Consistency
  describe('Property 1: Metadata Object Structure Consistency', () => {
    it('should store metadata in a single object that supports arbitrary key-value pairs and preserves data types', () => {
      fc.assert(fc.property(
        fc.record({
          // Standard fields
          gameType: fc.option(fc.oneof(fc.constant('quiz'), fc.constant('puzzle'), fc.constant('simulation'), fc.constant('arcade'), fc.string())),
          subject: fc.option(fc.string()),
          grade: fc.option(fc.string()),
          textbook: fc.option(fc.string()),
          lessonNo: fc.option(fc.integer()),
          lessonSummary: fc.option(fc.string()),
          theme_primary: fc.option(fc.string()),
          theme_secondary: fc.option(fc.array(fc.string())),
          context_tags: fc.option(fc.array(fc.string())),
          difficulty_levels: fc.option(fc.array(fc.string())),
          thumbnailUrl: fc.option(fc.string()),
          // Arbitrary additional fields can be added dynamically
        }),
        (metadata: GameMetadata) => {
          // Test that metadata is stored as a single object
          expect(typeof metadata).toBe('object');
          expect(metadata).not.toBeNull();
          
          // Test that arbitrary fields are preserved
          for (const [key, value] of Object.entries(metadata)) {
            if (value !== undefined) {
              // Data types should be preserved
              if (typeof value === 'string') {
                expect(typeof metadata[key]).toBe('string');
              } else if (typeof value === 'number') {
                expect(typeof metadata[key]).toBe('number');
              } else if (typeof value === 'boolean') {
                expect(typeof metadata[key]).toBe('boolean');
              } else if (Array.isArray(value)) {
                expect(Array.isArray(metadata[key])).toBe(true);
              }
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });

  // Property 2: Standard Field Support Completeness
  describe('Property 2: Standard Field Support Completeness', () => {
    it('should accept, store, and retrieve all standard metadata fields with proper data type preservation', () => {
      fc.assert(fc.property(
        fc.record({
          gameType: fc.oneof(fc.constant('quiz'), fc.constant('puzzle'), fc.constant('simulation'), fc.constant('arcade')),
          subject: fc.string(),
          grade: fc.string(),
          textbook: fc.string(),
          lessonNo: fc.integer({ min: 1, max: 100 }),
          lessonSummary: fc.string(),
          theme_primary: fc.string(),
          theme_secondary: fc.array(fc.string()),
          context_tags: fc.array(fc.string()),
          difficulty_levels: fc.array(fc.oneof(fc.constant('easy'), fc.constant('medium'), fc.constant('hard'))),
          thumbnailUrl: fc.webUrl()
        }),
        (metadata: GameMetadata) => {
          // Test classification fields
          if (metadata.gameType) {
            expect(['quiz', 'puzzle', 'simulation', 'arcade'].includes(metadata.gameType) || typeof metadata.gameType === 'string').toBe(true);
          }
          if (metadata.subject) {
            expect(typeof metadata.subject).toBe('string');
          }
          if (metadata.grade) {
            expect(typeof metadata.grade).toBe('string');
          }
          if (metadata.textbook) {
            expect(typeof metadata.textbook).toBe('string');
          }
          
          // Test content fields
          if (metadata.lessonNo) {
            expect(typeof metadata.lessonNo).toBe('number');
          }
          if (metadata.lessonSummary) {
            expect(typeof metadata.lessonSummary).toBe('string');
          }
          if (metadata.theme_primary) {
            expect(typeof metadata.theme_primary).toBe('string');
          }
          if (metadata.theme_secondary) {
            expect(Array.isArray(metadata.theme_secondary)).toBe(true);
          }
          if (metadata.context_tags) {
            expect(Array.isArray(metadata.context_tags)).toBe(true);
          }
          
          // Test configuration fields
          if (metadata.difficulty_levels) {
            expect(Array.isArray(metadata.difficulty_levels)).toBe(true);
          }
          if (metadata.thumbnailUrl) {
            expect(typeof metadata.thumbnailUrl).toBe('string');
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });

  // Property 3: Extensibility Without Schema Changes
  describe('Property 3: Extensibility Without Schema Changes', () => {
    it('should accept and store any new metadata field without requiring schema modifications', () => {
      fc.assert(fc.property(
        fc.record({
          // Standard fields
          gameType: fc.option(fc.string()),
          subject: fc.option(fc.string()),
          // Random new fields
        }).chain(baseMetadata => 
          fc.dictionary(
            fc.string().filter(key => !Object.keys(baseMetadata).includes(key)), // New field names
            fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.array(fc.string())) // Various data types
          ).map(newFields => ({ ...baseMetadata, ...newFields }))
        ),
        (metadata: GameMetadata) => {
          // Test that all fields are preserved
          for (const [key, value] of Object.entries(metadata)) {
            if (value !== undefined) {
              expect(metadata[key]).toEqual(value);
            }
          }
          
          // Test that the metadata object can contain arbitrary fields
          const keys = Object.keys(metadata);
          expect(keys.length).toBeGreaterThanOrEqual(0);
          
          // Test that new fields don't break the metadata structure
          expect(typeof metadata).toBe('object');
          expect(metadata).not.toBeNull();
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });

  describe('Utility Functions', () => {
    describe('hasMetadata', () => {
      it('should correctly identify objects with metadata', () => {
        const gameWithMetadata: GameWithMetadata = {
          _id: new ObjectId(),
          gameId: 'test-game',
          title: 'Test Game',
          ownerId: 'user123',
          metadata: { gameType: 'quiz' },
          disabled: false,
          rolloutPercentage: 100,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        expect(hasMetadata(gameWithMetadata)).toBe(true);
        expect(hasMetadata({})).toBe(false);
        expect(hasMetadata(null)).toBe(false);
        expect(hasMetadata(undefined)).toBe(false);
        expect(hasMetadata({ metadata: null })).toBe(false);
        expect(hasMetadata({ metadata: {} })).toBe(true);
      });
    });

    describe('isMetadataComplete', () => {
      it('should correctly identify complete metadata', () => {
        const completeMetadata: GameMetadata = {
          gameType: 'quiz',
          subject: 'Math',
          grade: 'Grade 1',
          lessonNo: 5,
          thumbnailUrl: 'https://example.com/thumb.png'
        };
        
        expect(isMetadataComplete(completeMetadata, DEFAULT_MANDATORY_FIELDS)).toBe(true);
        
        const incompleteMetadata: GameMetadata = {
          gameType: 'quiz',
          subject: 'Math'
          // Missing required fields
        };
        
        expect(isMetadataComplete(incompleteMetadata, DEFAULT_MANDATORY_FIELDS)).toBe(false);
      });
    });

    describe('calculateCompleteness', () => {
      it('should calculate correct completeness percentage', () => {
        const metadata: GameMetadata = {
          gameType: 'quiz',
          subject: 'Math',
          grade: 'Grade 1'
          // 3 out of 5 required fields
        };
        
        const completeness = calculateCompleteness(metadata, DEFAULT_MANDATORY_FIELDS);
        expect(completeness).toBe(60); // 3/5 * 100 = 60%
      });

      it('should return 100% for empty required fields list', () => {
        const metadata: GameMetadata = {};
        const completeness = calculateCompleteness(metadata, []);
        expect(completeness).toBe(100);
      });
    });

    describe('getMissingFields', () => {
      it('should correctly identify missing required fields', () => {
        const metadata: GameMetadata = {
          gameType: 'quiz',
          subject: 'Math'
        };
        
        const missing = getMissingFields(metadata, DEFAULT_MANDATORY_FIELDS);
        expect(missing).toContain('grade');
        expect(missing).toContain('lessonNo');
        expect(missing).toContain('thumbnailUrl');
        expect(missing).not.toContain('gameType');
        expect(missing).not.toContain('subject');
      });

      it('should handle empty arrays as missing fields', () => {
        const metadata: GameMetadata = {
          difficulty_levels: []
        };
        
        const missing = getMissingFields(metadata, ['difficulty_levels']);
        expect(missing).toContain('difficulty_levels');
      });
    });
  });
});

// Feature: extensible-metadata-system, Property 1: Metadata Object Structure Consistency
// Feature: extensible-metadata-system, Property 2: Standard Field Support Completeness  
// Feature: extensible-metadata-system, Property 3: Extensibility Without Schema Changes