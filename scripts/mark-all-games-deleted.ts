#!/usr/bin/env node

/**
 * Mark ALL games as soft-deleted (isDeleted=true)
 * 
 * This script will mark all active games as soft-deleted without actually removing data.
 * This is useful as a preparation step before hard deletion.
 * 
 * Usage: 
 *   node scripts/mark-all-games-deleted.ts --dry-run    # Preview
 *   node scripts/mark-all-games-deleted.ts --confirm    # Mark as deleted
 */

import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedev';
const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRM = process.argv.includes('-