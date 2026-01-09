#!/usr/bin/env node
/**
 * HARD DELETE ALL GAMES SCRIPT
 * 
 * ⚠️  WARNING: This script will PERMANENTLY DELETE all game data!
 * - All games and versions from MongoDB
 * - All game history and QC reports
 * - All game files from Google Cloud Storage
 * - Registry data
 * 
 * Usage:
 *   npm run hard-delete-games              # Execute deletion
 *   npm run hard-delete-games -- --dry-run # Preview what will be deleted
 */

import 'dotenv/config';
import { getMongoClient, closeConnection } from '../src/lib/mongodb';
import { GameRepository } from '../src/models/Game';
import { GameVersionRepository } from '../src/models/GameVersion';
import { GameHistoryRepository } from '../src/models/GameHistory';
import { QCReportRepository } from '../src/models/QcReport';
import { NotificationRepository } from '../src/models/Notification';
import { RegistryManager } from '../src/lib/registry';
import { Storage } from '@google-cloud/storage';

interface DeletionStats {
  games: number;
  versions: number;
  history: number;
  qcReports: number;
  notifications: number;
  gcsFiles: number;
  registryCleared: boolean;
}

class HardDeleteService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: process.env.GCLOUD_PROJECT_ID,
      keyFilename: process.env.GCLOUD_KEY_FILE, // If using service account file
      credentials: process.env.GCLOUD_PRIVATE_KEY ? {
        client_email: process.env.GCLOUD_CLIENT_EMAIL,
        private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      } : undefined,
    });
    this.bucketName = process.env.GCLOUD_BUCKET_NAME || 'iruka-edu-mini-game';
  }

  /**
   * Preview what will be deleted (dry run)
   */
  async previewDeletion(): Promise<DeletionStats> {
    console.log('🔍 Scanning database for game data...\n');

    const { db } = await getMongoClient();
    
    // Count documents in each collection
    const gameCount = await db.collection('games').countDocuments();
    const versionCount = await db.collection('game_versions').countDocuments();
    const historyCount = await db.collection('game_history').countDocuments();
    const qcReportCount = await db.collection('qc_reports').countDocuments();
    const notificationCount = await db.collection('notifications').countDocuments({ type: { $regex: /game/i } });

    // Count GCS files
    let gcsFileCount = 0;
    try {
      const [files] = await this.storage.bucket(this.bucketName).getFiles({
        prefix: 'games/',
      });
      gcsFileCount = files.length;
    } catch (error) {
      console.warn('⚠️  Could not access GCS bucket:', error.message);
    }

    const stats: DeletionStats = {
      games: gameCount,
      versions: versionCount,
      history: historyCount,
      qcReports: qcReportCount,
      notifications: notificationCount,
      gcsFiles: gcsFileCount,
      registryCleared: true, // Will be cleared
    };

    return stats;
  }

  /**
   * Execute hard deletion of all game data
   */
  async executeHardDeletion(): Promise<DeletionStats> {
    console.log('💀 Starting HARD DELETION of all game data...\n');

    const { db } = await getMongoClient();
    const stats: DeletionStats = {
      games: 0,
      versions: 0,
      history: 0,
      qcReports: 0,
      notifications: 0,
      gcsFiles: 0,
      registryCleared: false,
    };

    try {
      // 1. Delete MongoDB collections
      console.log('🗑️  Deleting MongoDB collections...');
      
      const gameResult = await db.collection('games').deleteMany({});
      stats.games = gameResult.deletedCount || 0;
      console.log(`   ✓ Deleted ${stats.games} games`);

      const versionResult = await db.collection('game_versions').deleteMany({});
      stats.versions = versionResult.deletedCount || 0;
      console.log(`   ✓ Deleted ${stats.versions} game versions`);

      const historyResult = await db.collection('game_history').deleteMany({});
      stats.history = historyResult.deletedCount || 0;
      console.log(`   ✓ Deleted ${stats.history} history entries`);

      const qcResult = await db.collection('qc_reports').deleteMany({});
      stats.qcReports = qcResult.deletedCount || 0;
      console.log(`   ✓ Deleted ${stats.qcReports} QC reports`);

      const notificationResult = await db.collection('notifications').deleteMany({
        type: { $regex: /game/i }
      });
      stats.notifications = notificationResult.deletedCount || 0;
      console.log(`   ✓ Deleted ${stats.notifications} game notifications`);

      // 2. Delete Google Cloud Storage files
      console.log('\n☁️  Deleting Google Cloud Storage files...');
      try {
        const [files] = await this.storage.bucket(this.bucketName).getFiles({
          prefix: 'games/',
        });

        if (files.length > 0) {
          // Delete files in batches to avoid timeout
          const batchSize = 100;
          for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            await Promise.all(batch.map(file => file.delete()));
            stats.gcsFiles += batch.length;
            console.log(`   ✓ Deleted ${stats.gcsFiles}/${files.length} files`);
          }
        } else {
          console.log('   ✓ No GCS files to delete');
        }
      } catch (error) {
        console.error('   ❌ Error deleting GCS files:', error.message);
      }

      // 3. Clear registry
      console.log('\n📋 Clearing registry...');
      try {
        await RegistryManager.clearRegistry();
        stats.registryCleared = true;
        console.log('   ✓ Registry cleared');
      } catch (error) {
        console.error('   ❌ Error clearing registry:', error.message);
      }

      console.log('\n✅ Hard deletion completed successfully!');
      return stats;

    } catch (error) {
      console.error('\n❌ Hard deletion failed:', error);
      throw error;
    }
  }

  /**
   * Print deletion statistics
   */
  printStats(stats: DeletionStats, isDryRun: boolean = false) {
    const prefix = isDryRun ? '[DRY RUN] Would delete:' : 'Deleted:';
    
    console.log('\n' + '='.repeat(50));
    console.log(isDryRun ? 'DELETION PREVIEW' : 'DELETION SUMMARY');
    console.log('='.repeat(50));
    console.log(`${prefix}`);
    console.log(`  📦 Games: ${stats.games}`);
    console.log(`  🔢 Versions: ${stats.versions}`);
    console.log(`  📜 History entries: ${stats.history}`);
    console.log(`  🔍 QC reports: ${stats.qcReports}`);
    console.log(`  🔔 Notifications: ${stats.notifications}`);
    console.log(`  ☁️  GCS files: ${stats.gcsFiles}`);
    console.log(`  📋 Registry: ${stats.registryCleared ? 'Cleared' : 'Not cleared'}`);
    console.log('='.repeat(50));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('💀 HARD DELETE ALL GAMES SCRIPT');
  console.log('='.repeat(50));
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No data will be deleted\n');
  } else {
    console.log('⚠️  DANGER: This will PERMANENTLY delete ALL game data!');
    console.log('   - All games and versions');
    console.log('   - All history and QC reports');
    console.log('   - All files from Google Cloud Storage');
    console.log('   - Registry data\n');
    
    console.log('💡 Tip: Run with --dry-run first to preview\n');
    
    // Confirmation prompt
    const { createInterface } = await import('readline');
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('Type "DELETE ALL GAMES" to confirm: ', resolve);
    });
    rl.close();

    if (answer !== 'DELETE ALL GAMES') {
      console.log('❌ Deletion cancelled');
      process.exit(0);
    }
  }

  try {
    const service = new HardDeleteService();
    
    if (isDryRun) {
      const stats = await service.previewDeletion();
      service.printStats(stats, true);
    } else {
      const stats = await service.executeHardDeletion();
      service.printStats(stats, false);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the script
main().catch(console.error);