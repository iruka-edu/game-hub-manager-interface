#!/usr/bin/env node

/**
 * Background job for hard deleting games
 * 
 * This script should be run as a cron job to safely delete games that have been
 * marked for hard deletion and meet all safety criteria.
 * 
 * Usage: node scripts/hard-delete-games-job.ts [--dry-run]
 */

import { MongoClient, ObjectId } from 'mongodb';
import { Storage } from '@google-cloud/storage';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedev';
const GCS_BUCKET = process.env.GCS_BUCKET || 'iruka-edu-mini-game';
const DRY_RUN = process.argv.includes('--dry-run');

interface Game {
  _id: ObjectId;
  gameId: string;
  title: string;
  gcsPath?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
}

interface HardDeleteResult {
  gameId: string;
  title: string;
  success: boolean;
  error?: string;
  filesDeleted?: number;
  gcsPath?: string;
}

class HardDeleteJob {
  private mongoClient: MongoClient;
  private storage: Storage;

  constructor() {
    this.mongoClient = new MongoClient(MONGODB_URI);
    this.storage = new Storage();
  }

  async run(): Promise<void> {
    console.log(`🚀 Starting hard delete job (DRY_RUN: ${DRY_RUN})`);
    
    try {
      await this.mongoClient.connect();
      console.log('✅ Connected to MongoDB');

      const db = this.mongoClient.db();
      const gamesCollection = db.collection<Game>('games');

      // Find games marked for hard deletion
      const candidates = await this.findHardDeleteCandidates(gamesCollection);
      console.log(`📋 Found ${candidates.length} games marked for hard deletion`);

      if (candidates.length === 0) {
        console.log('✨ No games to delete');
        return;
      }

      const results: HardDeleteResult[] = [];

      for (const game of candidates) {
        console.log(`\n🔍 Processing game: ${game.title} (${game.gameId})`);
        
        const result = await this.processGame(game, gamesCollection);
        results.push(result);
        
        if (result.success) {
          console.log(`✅ Successfully processed: ${game.gameId}`);
        } else {
          console.log(`❌ Failed to process: ${game.gameId} - ${result.error}`);
        }
      }

      // Summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`\n📊 Summary:`);
      console.log(`   Successful: ${successful}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Total: ${results.length}`);

      if (DRY_RUN) {
        console.log('\n🔍 This was a dry run - no actual deletions were performed');
      }

    } catch (error) {
      console.error('❌ Job failed:', error);
      process.exit(1);
    } finally {
      await this.mongoClient.close();
    }
  }

  private async findHardDeleteCandidates(collection: any): Promise<Game[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return collection.find({
      isDeleted: true,
      deleteReason: { $regex: /^hard_delete_requested:/ },
      deletedAt: { $lt: thirtyDaysAgo } // At least 30 days old
    }).toArray();
  }

  private async processGame(game: Game, collection: any): Promise<HardDeleteResult> {
    const result: HardDeleteResult = {
      gameId: game.gameId,
      title: game.title,
      success: false,
      gcsPath: game.gcsPath
    };

    try {
      // Additional safety checks
      if (!this.isSafeForHardDelete(game)) {
        result.error = 'Failed safety checks';
        return result;
      }

      // Delete GCS files
      if (game.gcsPath && !DRY_RUN) {
        const filesDeleted = await this.deleteGCSFiles(game.gcsPath);
        result.filesDeleted = filesDeleted;
        console.log(`   🗑️  Deleted ${filesDeleted} files from GCS`);
      } else if (game.gcsPath && DRY_RUN) {
        const fileCount = await this.countGCSFiles(game.gcsPath);
        result.filesDeleted = fileCount;
        console.log(`   🔍 Would delete ${fileCount} files from GCS`);
      }

      // Delete related records (versions, etc.)
      if (!DRY_RUN) {
        await this.deleteRelatedRecords(game._id);
        console.log(`   🗑️  Deleted related records`);
      } else {
        console.log(`   🔍 Would delete related records`);
      }

      // Delete the game record
      if (!DRY_RUN) {
        await collection.deleteOne({ _id: game._id });
        console.log(`   🗑️  Deleted game record`);
      } else {
        console.log(`   🔍 Would delete game record`);
      }

      result.success = true;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  private isSafeForHardDelete(game: Game): boolean {
    // Check if game is old enough (30+ days since deletion)
    if (!game.deletedAt) return false;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (game.deletedAt > thirtyDaysAgo) return false;

    // Check if marked for hard deletion
    if (!game.deleteReason?.startsWith('hard_delete_requested:')) return false;

    // TODO: Add additional safety checks:
    // - Check for learner sessions
    // - Check for lesson mappings
    // - Check for audit requirements
    
    return true;
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

  private async deleteRelatedRecords(gameId: ObjectId): Promise<void> {
    const db = this.mongoClient.db();
    
    // Delete game versions
    await db.collection('game_versions').deleteMany({ gameId });
    
    // TODO: Delete other related records based on your schema:
    // - Game history
    // - Audit logs (if not preserved)
    // - Session data (if any)
    // - Lesson mappings (if any)
  }
}

async function main() {
  const job = new HardDeleteJob();
  await job.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { HardDeleteJob };