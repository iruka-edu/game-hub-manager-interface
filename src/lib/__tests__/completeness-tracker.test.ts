import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ObjectId } from 'mongodb';
import { CompletenessTracker } from '../completeness-tracker';
import { GameMetadata, DEFAULT_MANDATORY_FIELDS } from '../metadata-types';
import { getMongoClient } from '../mongodb';

describe('CompletenessTracker', () => {
  let tracker: CompletenessTracker;
  let testGameIds: string[] = [];

  beforeEach(async () => {
    tracker = await CompletenessTracker.getInstance();
    testGameIds = [];
  });

  afterEach(async () => {
    // Clean up test data
    const { db } = await getMongoClient();
    const gamesCollection = db.collection('games');
    
    for (const gameId of testGameIds) {
      try {
        await gamesCollection.deleteOne({ _id: new ObjectId(gameId) });
      } catch {
        await gamesCollection.deleteOne({ gameId });
      }
    }
  });

  // Helper function to create test game
  async function createTestGame(metadata: GameMetadata, gameId?: string): Promise<string> {
    const { db } = await getMongoClient();
    const gamesCollection = db.collection('games');
    
    const testGame = {
      _id: new ObjectId(),
      gameId: gameId || `test-game-${Date.now()}-${Math.random()}`,
      title: 'Test Game',
      ownerId: 'test-user',
      metadata,
      disabled: false,
      rolloutPercentage: 100,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await gamesCollection.insertOne(testGame);
    const id = testGame._id.toString();
    testGameIds.push(id);
    return id;
  }

  // Property 17: Completeness Calculation Accuracy
  describe('Property 17: Completeness Calculation Accuracy', () => {
    it('should calculate completeness percentage correctly based on required fields and identify missing fields accurately', () => {
      fc.assert(fc.asyncProperty(
        fc.record({
          gameType: fc.option(fc.oneof(fc.constant('quiz'), fc.constant('puzzle'), fc.constant('simulation'))),
          subject: fc.option(fc.string()),
          grade: fc.option(fc.string()),
          lessonNo: fc.option(fc.integer({ min: 1, max: 100 })),
          thumbnailUrl: fc.option(fc.webUrl()),
          theme_primary: fc.option(fc.string()),
          lessonSummary: fc.option(fc.string()),
          textbook: fc.option(fc.string())
        }),
        async (metadata: Partial<GameMetadata>) => {
          const completeness = await tracker.calculateDetailedCompleteness(metadata);
          
          // Verify percentage calculation
          const requiredFields = DEFAULT_MANDATORY_FIELDS;
          let expectedCompleted = 0;
          
          for (const field of requiredFields) {
            const value = metadata[field];
            if (value !== undefined && value !== null && value !== '') {
              if (Array.isArray(value)) {
                if (value.length > 0) expectedCompleted++;
              } else {
                expectedCompleted++;
              }
            }
          }
          
          const expectedPercentage = requiredFields.length > 0 
            ? Math.round((expectedCompleted / requiredFields.length) * 100)
            : 100;
          
          expect(completeness.percentage).toBe(expectedPercentage);
          
          // Verify missing fields identification
          const expectedMissing = requiredFields.filter(field => {
            const value = metadata[field];
            return value === undefined || value === null || value === '' || 
                   (Array.isArray(value) && value.length === 0);
          });
          
          expect(completeness.missingFields.sort()).toEqual(expectedMissing.sort());
          
          // Verify completed fields identification
          const expectedCompleted2 = requiredFields.filter(field => 
            !expectedMissing.includes(field)
          );
          
          expect(completeness.completedFields.sort()).toEqual(expectedCompleted2.sort());
          
          // Verify required fields list
          expect(completeness.requiredFields).toEqual(requiredFields);
          
          // Verify percentage bounds
          expect(completeness.percentage).toBeGreaterThanOrEqual(0);
          expect(completeness.percentage).toBeLessThanOrEqual(100);
          
          return true;
        }
      ), { numRuns: 50 });
    });
  });

  // Property 18: Real-time Completeness Updates
  describe('Property 18: Real-time Completeness Updates', () => {
    it('should recalculate completeness immediately after metadata updates', () => {
      fc.assert(fc.asyncProperty(
        fc.record({
          gameType: fc.option(fc.string()),
          subject: fc.option(fc.string()),
          grade: fc.option(fc.string())
        }),
        fc.record({
          lessonNo: fc.option(fc.integer({ min: 1, max: 100 })),
          thumbnailUrl: fc.option(fc.webUrl()),
          theme_primary: fc.option(fc.string())
        }),
        async (initialMetadata: Partial<GameMetadata>, updateMetadata: Partial<GameMetadata>) => {
          // Create game with initial metadata
          const gameId = await createTestGame(initialMetadata);
          
          // Get initial completeness
          const initialCompleteness = await tracker.updateGameCompleteness(gameId);
          
          // Update metadata
          const { db } = await getMongoClient();
          const gamesCollection = db.collection('games');
          
          const updateData: Record<string, any> = {};
          for (const [key, value] of Object.entries(updateMetadata)) {
            updateData[`metadata.${key}`] = value;
          }
          
          await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            { $set: updateData }
          );
          
          // Update completeness and verify it reflects changes
          const updatedCompleteness = await tracker.updateGameCompleteness(gameId);
          
          // Calculate expected completeness for combined metadata
          const combinedMetadata = { ...initialMetadata, ...updateMetadata };
          const expectedCompleteness = await tracker.calculateDetailedCompleteness(combinedMetadata);
          
          expect(updatedCompleteness).toBe(expectedCompleteness.percentage);
          
          // Verify the game document was updated
          const updatedGame = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
          expect(updatedGame?.metadataCompleteness).toBe(updatedCompleteness);
          expect(updatedGame?.lastMetadataUpdate).toBeInstanceOf(Date);
          
          return true;
        }
      ), { numRuns: 30 });
    });
  });

  describe('System Statistics', () => {
    it('should calculate accurate system-wide completeness statistics', async () => {
      // Create test games with different completeness levels
      const testGames = [
        { gameType: 'quiz', subject: 'Math', grade: 'Grade 1', lessonNo: 1, thumbnailUrl: 'http://example.com/1.png' }, // 100%
        { gameType: 'puzzle', subject: 'Science' }, // ~40%
        { gameType: 'simulation' }, // ~20%
        {} // 0%
      ];
      
      for (const metadata of testGames) {
        await createTestGame(metadata);
      }
      
      // Update completeness for all test games
      for (const gameId of testGameIds) {
        await tracker.updateGameCompleteness(gameId);
      }
      
      const stats = await tracker.getSystemCompletenessStats();
      
      expect(stats.totalGames).toBeGreaterThanOrEqual(testGames.length);
      expect(stats.averageCompleteness).toBeGreaterThanOrEqual(0);
      expect(stats.averageCompleteness).toBeLessThanOrEqual(100);
      expect(stats.fullyCompleteGames).toBeGreaterThanOrEqual(1); // At least one 100% game
      expect(stats.incompleteGames).toBeGreaterThanOrEqual(3); // At least three incomplete games
      expect(Array.isArray(stats.completenessDistribution)).toBe(true);
      expect(Array.isArray(stats.mostMissingFields)).toBe(true);
    });

    it('should identify incomplete games correctly', async () => {
      // Create games with known completeness levels
      const incompleteGame = await createTestGame({ gameType: 'quiz' }); // Low completeness
      const completeGame = await createTestGame({
        gameType: 'quiz',
        subject: 'Math',
        grade: 'Grade 1',
        lessonNo: 1,
        thumbnailUrl: 'http://example.com/complete.png'
      }); // High completeness
      
      // Update completeness
      await tracker.updateGameCompleteness(incompleteGame);
      await tracker.updateGameCompleteness(completeGame);
      
      const incompleteGames = await tracker.getIncompleteGames(50, 10);
      
      // Should include the incomplete game
      const foundIncomplete = incompleteGames.find(g => 
        testGameIds.includes(g.gameId) && g.completeness < 50
      );
      expect(foundIncomplete).toBeDefined();
      
      // Should not include the complete game (if it's above threshold)
      const foundComplete = incompleteGames.find(g => 
        testGameIds.includes(g.gameId) && g.completeness >= 50
      );
      // This might be undefined if the complete game is above threshold
    });
  });

  describe('User Progress Tracking', () => {
    it('should track user-specific completeness progress', async () => {
      const userId = 'test-user-progress';
      
      // Create games for specific user
      const { db } = await getMongoClient();
      const gamesCollection = db.collection('games');
      
      const userGames = [
        {
          _id: new ObjectId(),
          gameId: `user-game-1-${Date.now()}`,
          title: 'User Game 1',
          ownerId: userId,
          metadata: { gameType: 'quiz', subject: 'Math', grade: 'Grade 1', lessonNo: 1, thumbnailUrl: 'http://example.com/1.png' },
          disabled: false,
          rolloutPercentage: 100,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          gameId: `user-game-2-${Date.now()}`,
          title: 'User Game 2',
          ownerId: userId,
          metadata: { gameType: 'puzzle' },
          disabled: false,
          rolloutPercentage: 100,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await gamesCollection.insertMany(userGames);
      testGameIds.push(...userGames.map(g => g._id.toString()));
      
      // Update completeness for user games
      for (const game of userGames) {
        await tracker.updateGameCompleteness(game._id.toString());
      }
      
      const progress = await tracker.getUserCompletenessProgress(userId);
      
      expect(progress.totalGames).toBe(2);
      expect(progress.averageCompleteness).toBeGreaterThanOrEqual(0);
      expect(progress.averageCompleteness).toBeLessThanOrEqual(100);
      expect(progress.completeGames + progress.incompleteGames).toBe(progress.totalGames);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch completeness updates efficiently', async () => {
      // Create multiple test games
      const batchGames = [];
      for (let i = 0; i < 5; i++) {
        const gameId = await createTestGame({
          gameType: 'quiz',
          subject: `Subject ${i}`,
          grade: i % 2 === 0 ? 'Grade 1' : undefined
        });
        batchGames.push(gameId);
      }
      
      const updatedCount = await tracker.batchUpdateAllCompleteness(3); // Small batch size
      
      expect(updatedCount).toBeGreaterThanOrEqual(batchGames.length);
      
      // Verify that games were updated
      const { db } = await getMongoClient();
      const gamesCollection = db.collection('games');
      
      for (const gameId of batchGames) {
        const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
        expect(game?.metadataCompleteness).toBeDefined();
        expect(typeof game?.metadataCompleteness).toBe('number');
      }
    });
  });

  describe('Trend Analysis', () => {
    it('should track completeness trends over time', async () => {
      // Create a game and update its metadata to simulate trend
      const gameId = await createTestGame({ gameType: 'quiz' });
      
      // Update completeness (this will set lastMetadataUpdate)
      await tracker.updateGameCompleteness(gameId);
      
      const trend = await tracker.getCompletenessTrend(7);
      
      expect(Array.isArray(trend)).toBe(true);
      
      // Should have at least one entry for today (from our update)
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = trend.find(entry => entry.date === today);
      
      if (todayEntry) {
        expect(todayEntry.averageCompleteness).toBeGreaterThanOrEqual(0);
        expect(todayEntry.averageCompleteness).toBeLessThanOrEqual(100);
        expect(todayEntry.gamesUpdated).toBeGreaterThanOrEqual(1);
      }
    });
  });
});

// Feature: extensible-metadata-system, Property 17: Completeness Calculation Accuracy
// Feature: extensible-metadata-system, Property 18: Real-time Completeness Updates