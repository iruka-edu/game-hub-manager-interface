import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ObjectId } from 'mongodb';
import { MetadataService } from '../metadata-service';
import { GameMetadata } from '../metadata-types';
import { getMongoClient } from '../mongodb';

describe('MetadataService', () => {
  let metadataService: MetadataService;
  let testGameId: string;

  beforeEach(async () => {
    metadataService = await MetadataService.getInstance();
    
    // Create a test game for testing
    const { db } = await getMongoClient();
    const gamesCollection = db.collection('games');
    
    const testGame = {
      _id: new ObjectId(),
      gameId: `test-game-${Date.now()}`,
      title: 'Test Game',
      ownerId: 'test-user',
      metadata: {
        gameType: 'quiz',
        subject: 'Math'
      },
      disabled: false,
      rolloutPercentage: 100,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await gamesCollection.insertOne(testGame);
    testGameId = testGame._id.toString();
  });

  afterEach(async () => {
    // Clean up test data
    const { db } = await getMongoClient();
    const gamesCollection = db.collection('games');
    const auditCollection = db.collection('metadata_audit_logs');
    
    await gamesCollection.deleteMany({ ownerId: 'test-user' });
    await auditCollection.deleteMany({ userId: 'test-user' });
  });

  // Property 4: Metadata Update Merge Consistency
  describe('Property 4: Metadata Update Merge Consistency', () => {
    it('should preserve existing metadata fields when updating unrelated fields using dot notation', () => {
      fc.assert(fc.asyncProperty(
        fc.record({
          gameType: fc.option(fc.oneof(fc.constant('quiz'), fc.constant('puzzle'), fc.constant('simulation'))),
          subject: fc.option(fc.string()),
          grade: fc.option(fc.string()),
          lessonNo: fc.option(fc.integer({ min: 1, max: 100 })),
          thumbnailUrl: fc.option(fc.webUrl())
        }),
        fc.record({
          theme_primary: fc.option(fc.string()),
          theme_secondary: fc.option(fc.array(fc.string())),
          difficulty_levels: fc.option(fc.array(fc.string()))
        }),
        async (initialMetadata: Partial<GameMetadata>, updateMetadata: Partial<GameMetadata>) => {
          // Set initial metadata
          await metadataService.updateGameMetadata(testGameId, initialMetadata, 'test-user');
          
          // Get initial state
          const beforeUpdate = await metadataService.getGameMetadata(testGameId);
          
          // Update with different fields
          await metadataService.updateGameMetadata(testGameId, updateMetadata, 'test-user');
          
          // Get updated state
          const afterUpdate = await metadataService.getGameMetadata(testGameId);
          
          // Verify that initial fields are preserved
          for (const [key, value] of Object.entries(initialMetadata)) {
            if (value !== undefined && !Object.keys(updateMetadata).includes(key)) {
              expect(afterUpdate[key]).toEqual(value);
            }
          }
          
          // Verify that updated fields are applied
          for (const [key, value] of Object.entries(updateMetadata)) {
            if (value !== undefined) {
              expect(afterUpdate[key]).toEqual(value);
            }
          }
          
          return true;
        }
      ), { numRuns: 50 });
    });
  });

  // Property 5: Field Removal Behavior
  describe('Property 5: Field Removal Behavior', () => {
    it('should remove fields set to null or undefined without affecting other fields', () => {
      fc.assert(fc.asyncProperty(
        fc.record({
          gameType: fc.string(),
          subject: fc.string(),
          grade: fc.string(),
          lessonNo: fc.integer(),
          theme_primary: fc.string()
        }),
        fc.constantFrom('gameType', 'subject', 'grade', 'lessonNo', 'theme_primary'),
        async (initialMetadata: GameMetadata, fieldToRemove: string) => {
          // Set initial metadata
          await metadataService.updateGameMetadata(testGameId, initialMetadata, 'test-user');
          
          // Remove one field by setting it to null
          const removalUpdate = { [fieldToRemove]: null };
          await metadataService.updateGameMetadata(testGameId, removalUpdate, 'test-user');
          
          // Get updated state
          const afterRemoval = await metadataService.getGameMetadata(testGameId);
          
          // Verify the field was removed
          expect(afterRemoval[fieldToRemove]).toBeUndefined();
          
          // Verify other fields are preserved
          for (const [key, value] of Object.entries(initialMetadata)) {
            if (key !== fieldToRemove) {
              expect(afterRemoval[key]).toEqual(value);
            }
          }
          
          return true;
        }
      ), { numRuns: 50 });
    });
  });

  // Property 6: Audit Trail Completeness
  describe('Property 6: Audit Trail Completeness', () => {
    it('should create audit log entries with timestamps and user information for all metadata changes', () => {
      fc.assert(fc.asyncProperty(
        fc.record({
          gameType: fc.option(fc.string()),
          subject: fc.option(fc.string()),
          grade: fc.option(fc.string())
        }),
        fc.string().filter(s => s.length > 0),
        async (metadata: Partial<GameMetadata>, userId: string) => {
          // Perform metadata update
          await metadataService.updateGameMetadata(testGameId, metadata, userId);
          
          // Get audit history
          const history = await metadataService.getMetadataHistory(testGameId, 10);
          
          // Verify audit entry was created
          expect(history.length).toBeGreaterThan(0);
          
          const latestEntry = history[0];
          expect(latestEntry.action).toBe('update');
          expect(latestEntry.userId).toBe(userId);
          expect(latestEntry.timestamp).toBeInstanceOf(Date);
          expect(latestEntry.changes).toEqual(metadata);
          expect(typeof latestEntry.previousValues).toBe('object');
          
          return true;
        }
      ), { numRuns: 30 });
    });
  });

  describe('Metadata Service Core Functions', () => {
    it('should handle legacy games without metadata objects', async () => {
      // Create a legacy game without metadata
      const { db } = await getMongoClient();
      const gamesCollection = db.collection('games');
      
      const legacyGame = {
        _id: new ObjectId(),
        gameId: `legacy-game-${Date.now()}`,
        title: 'Legacy Game',
        ownerId: 'test-user',
        // No metadata field
        disabled: false,
        rolloutPercentage: 100,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await gamesCollection.insertOne(legacyGame);
      const legacyGameId = legacyGame._id.toString();
      
      // Should return empty metadata for legacy game
      const metadata = await metadataService.getGameMetadata(legacyGameId);
      expect(metadata).toEqual({});
      
      // Should be able to update metadata on legacy game
      await metadataService.updateGameMetadata(legacyGameId, { gameType: 'quiz' }, 'test-user');
      
      const updatedMetadata = await metadataService.getGameMetadata(legacyGameId);
      expect(updatedMetadata.gameType).toBe('quiz');
    });

    it('should calculate completeness correctly', async () => {
      const metadata: GameMetadata = {
        gameType: 'quiz',
        subject: 'Math',
        grade: 'Grade 1',
        lessonNo: 5,
        thumbnailUrl: 'https://example.com/thumb.png'
      };
      
      const completeness = await metadataService.calculateCompleteness(metadata);
      expect(completeness.percentage).toBe(100); // All required fields present
      expect(completeness.missingFields).toEqual([]);
      expect(completeness.completedFields).toContain('gameType');
      expect(completeness.completedFields).toContain('subject');
    });

    it('should validate metadata format correctly', () => {
      const validMetadata: GameMetadata = {
        gameType: 'quiz',
        subject: 'Math',
        lessonNo: 5,
        theme_secondary: ['algebra', 'geometry'],
        thumbnailUrl: 'https://example.com/thumb.png'
      };
      
      const result = metadataService.validateMetadataFormat(validMetadata);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      
      const invalidMetadata: GameMetadata = {
        lessonNo: 'not-a-number' as any,
        theme_secondary: 'not-an-array' as any
      };
      
      const invalidResult = metadataService.validateMetadataFormat(invalidMetadata);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('lessonNo must be a number');
      expect(invalidResult.errors).toContain('theme_secondary must be an array');
    });

    it('should migrate legacy games correctly', async () => {
      // Create a legacy game without metadata
      const { db } = await getMongoClient();
      const gamesCollection = db.collection('games');
      
      const legacyGame = {
        _id: new ObjectId(),
        gameId: `migration-test-${Date.now()}`,
        title: 'Migration Test Game',
        ownerId: 'test-user',
        disabled: false,
        rolloutPercentage: 100,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await gamesCollection.insertOne(legacyGame);
      const legacyGameId = legacyGame._id.toString();
      
      // Migrate the game
      await metadataService.migrateLegacyGame(legacyGameId);
      
      // Verify migration
      const migratedGame = await gamesCollection.findOne({ _id: legacyGame._id });
      expect(migratedGame?.metadata).toEqual({});
      expect(migratedGame?.metadataCompleteness).toBe(0);
      expect(migratedGame?.lastMetadataUpdate).toBeInstanceOf(Date);
      
      // Verify audit log
      const history = await metadataService.getMetadataHistory(legacyGameId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].action).toBe('update');
      expect(history[0].userId).toBe('system-migration');
    });
  });
});

// Feature: extensible-metadata-system, Property 4: Metadata Update Merge Consistency
// Feature: extensible-metadata-system, Property 5: Field Removal Behavior
// Feature: extensible-metadata-system, Property 6: Audit Trail Completeness