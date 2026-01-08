#!/usr/bin/env node

/**
 * Hard delete only SOFT-DELETED games
 * 
 * This script will permanently delete games that are already marked as isDeleted=true
 * This is safer than deleting ALL games as it only affects games already in "trash"
 * 
 * Usage: 
 *   node scripts/hard-delete-soft-deleted-games.ts --dry-run    # Preview
 *   node scripts/hard-delete-soft-deleted-games.ts --confirm    # Delete
 */

import { MongoClient, ObjectId } from 'mongodb';
import { Storage } from '@google-cloud/storage';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedev';
const GCS_BUCKET = process.env.GCS_BUCKET || 'iruka-edu-mini-game';
const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRM = process.argv.includes('--confirm');

interface Game {
  _id: ObjectId;
  gameId: string;
  title: string;
  gcsPath?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
  ownerId: string;
}

interface DeleteStats {
  softDeletedGamesFound: number;
  gamesDeleted: number;
  versionsDeleted: number;
  gcsFilesDeleted: number;
  errors: string[];
}

class HardDeleteSoftDeletedGames {
  private mongoClient: MongoClient;
  private storage: Storage;

  constructor() {
    this.mongoClient = new MongoClient(MONGODB_URI);
    this.storage = new Storage();
  }

  async run(): Promise<void> {
    console.log('🗑️  HARD DELETE SOFT-DELETED GAMES');
    console.log('==================================');
    
    if (!DRY_RUN && !CONFIRM) {
      console.log('❌ ERROR: You must use either --dry-run or --confirm');
      console.log('');
      console.log('Usage:');
      console.log('  --dry-run    Preview what will be deleted');
      console.log('  --confirm    Actually delete soft-deleted games');
      process.exit(1);
    }

    console.log(`🚀 Starting ${DRY_RUN ? 'DRY RUN' : 'ACTUAL DELETION'}`);
    console.log('📋 Target: Games with isDeleted=true only');
    
    const stats: DeleteStats = {
      softDeletedGamesFound: 0,
      gamesDeleted: 0,
      versionsDeleted: 0,
      gcsFilesDeleted: 0,
      errors: []
    };

    try {
      await this.mongoClient.connect();
      console.log('✅ Connected to MongoDB');

      const db = this.mongoClient.db();
      
      // Process only soft-deleted games
      await this.processSoftDeletedGames(db, stats);
      
      // Show summary
      this.showSummary(stats);

    } catch (error) {
      console.error('❌ Script failed:', error);
      process.exit(1);
    } finally {
      await this.mongoClient.close();
    }
  }

  private async processSoftDeletedGames(db: any, stats: DeleteStats): Promise<void> {
    console.log('\n📋 Finding soft-deleted games...');
    
    const gamesCollection = db.collection<Game>('games');
    const versionsCollection = db.collection('game_versions');
    
    // Find only soft-deleted games
    const softDeletedGames = await gamesCollection.find({ isDeleted: true }).toArray();
    stats.softDeletedGamesFound = softDeletedGames.length;
    
    console.log(`Found ${softDeletedGames.length} soft-deleted games`);
    
    if (softDeletedGames.length === 0) {
      console.log('✨ No soft-deleted games found');
      return;
    }

    // Show details
    console.log('\n📋 Soft-deleted games:');
    softDeletedGames.forEach(game => {
      const deletedDate = game.deletedAt ? game.deletedAt.toISOString().split('T')[0] : 'unknown';
      console.log(`  - ${game.gameId}: "${game.title}" (deleted: ${deletedDate})`);
    });

    if (DRY_RUN) {
      console.log('\n🔍 DRY RUN - Would perform these actions:');
      
      for (const game of softDeletedGames) {
        console.log(`\n  Game: ${game.gameId}`);
        
        // Count versions for this game
        const versions = await versionsCollection.find({ gameId: game._id.toString() }).toArray();
        console.log(`    - Delete ${versions.length} versions`);
        
        // Count GCS files
        if (game.gcsPath) {
          const fileCount = await this.countGCSFiles(game.gcsPath);
          console.log(`    - Delete ${fileCount} GCS files from ${game.gcsPath}`);
        } else {
          // Fallback: check standard path
          const standardPath = `games/${game.gameId}/`;
          const fileCount = await this.countGCSFiles(standardPath);
          console.log(`    - Delete ${fileCount} GCS files from ${standardPath}`);
        }
        
        console.log(`    - Delete game record`);
      }
      
    } else {
      console.log('\n🗑️  Deleting soft-deleted games...');
      
      for (const game of softDeletedGames) {
        console.log(`\n🔍 Processing: ${game.gameId}`);
        
        try {
          // 1. Delete game versions
          const versionResult = await versionsCollection.deleteMany({ 
            gameId: game._id.toString() 
          });
          stats.versionsDeleted += versionResult.deletedCount;
          console.log(`  ✅ Deleted ${versionResult.deletedCount} versions`);
          
          // 2. Delete GCS files
          const gcsPath = game.gcsPath || `games/${game.gameId}/`;
          const filesDeleted = await this.deleteGCSFiles(gcsPath);
          stats.gcsFilesDeleted += filesDeleted;
          console.log(`  ✅ Deleted ${filesDeleted} GCS files`);
          
          // 3. Delete game record
          await gamesCollection.deleteOne({ _id: game._id });
          stats.gamesDeleted++;
          console.log(`  ✅ Deleted game record`);
          
        } catch (error) {
          const errorMsg = `Failed to delete game ${game.gameId}: ${error}`;
          stats.errors.push(errorMsg);
          console.log(`  ❌ ${errorMsg}`);
        }
      }
    }
  }

  private async countGCSFiles(gcsPath: string): Promise<number> {
    try {
      const bucket = this.storage.bucket(GCS_BUCKET);
      const [files] = await bucket.getFiles({ prefix: gcsPath });
      return files.length;
    } catch (error) {
      console.error(`Failed to count GCS files for ${gcsPath}:`, error);
      return 0;
    }
  }

  private async deleteGCSFiles(gcsPath: string): Promise<number> {
    try {
      const bucket = this.storage.bucket(GCS_BUCKET);
      const [files] = await bucket.getFiles({ prefix: gcsPath });
      
      if (files.length === 0) {
        return 0;
      }

      // Delete files in batches
      const batchSize = 100;
      let deletedCount = 0;

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(file => file.delete()));
        deletedCount += batch.length;
      }

      return deletedCount;
    } catch (error) {
      console.error(`Failed to delete GCS files for ${gcsPath}:`, error);
      throw error;
    }
  }

  private showSummary(stats: DeleteStats): void {
    console.log('\n📊 SUMMARY');
    console.log('==========');
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN RESULTS:');
      console.log(`  Soft-deleted games found: ${stats.softDeletedGamesFound}`);
      console.log('');
      console.log('⚠️  No actual deletions were performed');
      console.log('⚠️  Run with --confirm to actually delete soft-deleted games');
    } else {
      console.log('🗑️  DELETION RESULTS:');
      console.log(`  Games hard-deleted: ${stats.gamesDeleted}/${stats.softDeletedGamesFound}`);
      console.log(`  Game versions deleted: ${stats.versionsDeleted}`);
      console.log(`  GCS files deleted: ${stats.gcsFilesDeleted}`);
      
      if (stats.errors.length > 0) {
        console.log(`  Errors: ${stats.errors.length}`);
        console.log('\n❌ ERRORS:');
        stats.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (stats.errors.length === 0) {
        console.log('\n✅ ALL SOFT-DELETED GAMES SUCCESSFULLY HARD-DELETED');
      } else {
        console.log('\n⚠️  DELETION COMPLETED WITH ERRORS');
      }
    }
  }
}

async function main() {
  const job = new HardDeleteSoftDeletedGames();
  await job.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { HardDeleteSoftDeletedGames };