#!/usr/bin/env node
/**
 * Migration script to convert games from old model to versioning model
 * 
 * Usage:
 *   npm run migrate              # Run migration
 *   npm run migrate -- --dry-run # Simulate migration without changes
 *   npm run migrate -- --verify  # Verify migration integrity
 */

import { MigrationService } from '../src/lib/migration-service';
import { closeConnection } from '../src/lib/mongodb';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verify = args.includes('--verify');

  console.log('='.repeat(60));
  console.log('Game Versioning System - Migration Tool');
  console.log('='.repeat(60));
  console.log('');

  try {
    const migrationService = await MigrationService.getInstance();

    if (verify) {
      console.log('[Verify] Checking migration integrity...\n');
      const results = await migrationService.verifyMigration();
      
      console.log('Verification Results:');
      console.log(`  Total Games: ${results.totalGames}`);
      console.log(`  Migrated: ${results.migratedGames}`);
      console.log(`  Unmigrated: ${results.unmigratedGames}`);
      
      if (results.issues.length > 0) {
        console.log('\nIssues Found:');
        results.issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('\n✓ No issues found');
      }
    } else {
      if (dryRun) {
        console.log('[Dry Run] Simulating migration (no changes will be made)\n');
      } else {
        console.log('[Migration] Starting migration process...\n');
        console.log('⚠️  This will modify your database!');
        console.log('   Make sure you have a backup before proceeding.\n');
      }

      const result = await migrationService.migrateAllGames(dryRun);

      console.log('\n' + '='.repeat(60));
      console.log('Migration Summary');
      console.log('='.repeat(60));
      console.log(`Games Processed: ${result.gamesProcessed}`);
      console.log(`Versions Created: ${result.versionsCreated}`);
      console.log(`Skipped (already migrated): ${result.skipped}`);
      console.log(`Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }

      if (dryRun) {
        console.log('\n[Dry Run] No changes were made to the database');
        console.log('Run without --dry-run to perform actual migration');
      } else {
        console.log('\n✓ Migration complete!');
        console.log('Run with --verify to check migration integrity');
      }
    }

    // Close database connection
    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await closeConnection();
    process.exit(1);
  }
}

// Run the migration
main();
