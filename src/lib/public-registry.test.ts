/**
 * Test for Public Registry filtering logic
 * 
 * This test verifies that the filtering logic correctly:
 * 1. Includes only games with published versions
 * 2. Excludes disabled games
 * 3. Extracts only necessary metadata
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicRegistryManager } from './public-registry';
import type { Game } from '../models/Game';
import type { GameVersion } from '../models/GameVersion';
import { ObjectId } from 'mongodb';

// Mock the dependencies
vi.mock('./gcs', () => ({
  getFileContent: vi.fn(),
  saveFileContent: vi.fn(),
  CDN_BASE: 'https://cdn.example.com'
}));

vi.mock('../models/Game', () => ({
  GameRepository: {
    getInstance: vi.fn()
  }
}));

vi.mock('../models/GameVersion', () => ({
  GameVersionRepository: {
    getInstance: vi.fn()
  }
}));

describe('PublicRegistryManager filtering logic', () => {
  let mockGameRepo: any;
  let mockVersionRepo: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockGameRepo = {
      findPublishedAndEnabled: vi.fn()
    };
    
    mockVersionRepo = {
      findById: vi.fn()
    };
    
    // Mock the repository instances
    const { GameRepository } = await import('../models/Game');
    const { GameVersionRepository } = await import('../models/GameVersion');
    vi.mocked(GameRepository.getInstance).mockResolvedValue(mockGameRepo);
    vi.mocked(GameVersionRepository.getInstance).mockResolvedValue(mockVersionRepo);
  });

  it('should include games with published versions and exclude disabled games', async () => {
    // Arrange: Create test data
    const publishedVersionId = new ObjectId();
    const draftVersionId = new ObjectId();
    
    const publishedGame: Game = {
      _id: new ObjectId(),
      gameId: 'com.test.published',
      title: 'Published Game',
      ownerId: 'user1',
      liveVersionId: publishedVersionId,
      disabled: false,
      rolloutPercentage: 100,
      tags: ['math', 'grade1'],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Game;
    
    const disabledGame: Game = {
      _id: new ObjectId(),
      gameId: 'com.test.disabled',
      title: 'Disabled Game',
      ownerId: 'user1',
      liveVersionId: publishedVersionId,
      disabled: true, // This should be excluded
      rolloutPercentage: 100,
      tags: ['math'],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Game;
    
    const gameWithDraftVersion: Game = {
      _id: new ObjectId(),
      gameId: 'com.test.draft',
      title: 'Game with Draft Version',
      ownerId: 'user1',
      liveVersionId: draftVersionId,
      disabled: false,
      rolloutPercentage: 100,
      tags: ['math'],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Game;
    
    const publishedVersion: GameVersion = {
      _id: publishedVersionId,
      gameId: publishedGame._id,
      version: '1.0.0',
      storagePath: 'games/com.test.published/1.0.0/',
      entryFile: 'index.html',
      status: 'published', // This should be included
      submittedBy: new ObjectId(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as GameVersion;
    
    const draftVersion: GameVersion = {
      _id: draftVersionId,
      gameId: gameWithDraftVersion._id,
      version: '1.0.0',
      storagePath: 'games/com.test.draft/1.0.0/',
      entryFile: 'index.html',
      status: 'draft', // This should be excluded
      submittedBy: new ObjectId(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as GameVersion;
    
    // Mock repository responses
    // findPublishedAndEnabled should return only non-disabled games with liveVersionId
    mockGameRepo.findPublishedAndEnabled.mockResolvedValue([
      publishedGame,
      gameWithDraftVersion
      // disabledGame is excluded by the database query
    ]);
    
    mockVersionRepo.findById.mockImplementation((id: string) => {
      if (id === publishedVersionId.toString()) {
        return Promise.resolve(publishedVersion);
      }
      if (id === draftVersionId.toString()) {
        return Promise.resolve(draftVersion);
      }
      return Promise.resolve(null);
    });
    
    // Mock GCS save
    const { saveFileContent } = await import('./gcs');
    vi.mocked(saveFileContent).mockResolvedValue(undefined);
    
    // Act: Run the sync method
    const result = await PublicRegistryManager.sync();
    
    // Assert: Verify filtering logic
    expect(result.games).toHaveLength(1); // Only the published game should be included
    expect(result.games[0]).toEqual({
      id: 'com.test.published',
      title: 'Published Game',
      entryUrl: 'https://cdn.example.com/games/com.test.published/1.0.0/index.html',
      runtime: 'iframe-html',
      capabilities: ['math', 'grade1'],
      rolloutPercentage: 100,
      version: '1.0.0',
      updatedAt: publishedGame.updatedAt.toISOString()
    });
    
    // Verify that the repository methods were called correctly
    expect(mockGameRepo.findPublishedAndEnabled).toHaveBeenCalledTimes(1);
    expect(mockVersionRepo.findById).toHaveBeenCalledWith(publishedVersionId.toString());
    expect(mockVersionRepo.findById).toHaveBeenCalledWith(draftVersionId.toString());
    
    // Verify that the registry was saved to GCS
    expect(saveFileContent).toHaveBeenCalledWith(
      'registry/public.json',
      expect.objectContaining({
        games: expect.arrayContaining([
          expect.objectContaining({
            id: 'com.test.published'
          })
        ]),
        generatedAt: expect.any(String),
        version: expect.any(String)
      })
    );
  });

  it('should extract only necessary metadata fields', async () => {
    // Arrange: Create a game with extra fields that should not be in public registry
    const versionId = new ObjectId();
    
    const game: Game = {
      _id: new ObjectId(),
      gameId: 'com.test.metadata',
      title: 'Test Game',
      description: 'This should not appear in public registry',
      ownerId: 'user1', // This should not appear in public registry
      teamId: 'team1', // This should not appear in public registry
      liveVersionId: versionId,
      subject: 'Math', // This should not appear in public registry
      grade: 'Grade 1', // This should not appear in public registry
      disabled: false,
      rolloutPercentage: 75,
      tags: ['math', 'addition'],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Game;
    
    const version: GameVersion = {
      _id: versionId,
      gameId: game._id,
      version: '2.1.0',
      storagePath: 'games/com.test.metadata/2.1.0/',
      entryFile: 'index.html',
      status: 'published',
      submittedBy: new ObjectId(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as GameVersion;
    
    mockGameRepo.findPublishedAndEnabled.mockResolvedValue([game]);
    mockVersionRepo.findById.mockResolvedValue(version);
    
    const { saveFileContent } = await import('./gcs');
    vi.mocked(saveFileContent).mockResolvedValue(undefined);
    
    // Act
    const result = await PublicRegistryManager.sync();
    
    // Assert: Verify only necessary fields are included
    expect(result.games[0]).toEqual({
      id: 'com.test.metadata',
      title: 'Test Game',
      entryUrl: 'https://cdn.example.com/games/com.test.metadata/2.1.0/index.html',
      runtime: 'iframe-html',
      capabilities: ['math', 'addition'],
      rolloutPercentage: 75,
      version: '2.1.0',
      updatedAt: game.updatedAt.toISOString()
    });
    
    // Verify sensitive fields are NOT included
    expect(result.games[0]).not.toHaveProperty('description');
    expect(result.games[0]).not.toHaveProperty('ownerId');
    expect(result.games[0]).not.toHaveProperty('teamId');
    expect(result.games[0]).not.toHaveProperty('subject');
    expect(result.games[0]).not.toHaveProperty('grade');
    expect(result.games[0]).not.toHaveProperty('_id');
    expect(result.games[0]).not.toHaveProperty('liveVersionId');
  });
});