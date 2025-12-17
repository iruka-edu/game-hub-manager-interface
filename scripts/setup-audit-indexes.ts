/**
 * Script to set up audit log indexes in MongoDB
 * Run with: npx tsx scripts/setup-audit-indexes.ts
 */

import 'dotenv/config';
import { AuditLogger } from '../src/lib/audit';
import { closeConnection } from '../src/lib/mongodb';

async function main() {
  console.log('Setting up audit log indexes...');
  
  try {
    await AuditLogger.ensureIndexes();
    console.log('✓ Audit log indexes created successfully');
    console.log('  - Index on target.id');
    console.log('  - Index on actor.userId');
    console.log('  - Index on createdAt (descending)');
    console.log('  - TTL index on createdAt (90 days expiry)');
  } catch (error) {
    console.error('Failed to create indexes:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();
