#!/usr/bin/env node

/**
 * Script to diagnose and fix the "No version found for this game" issue
 * Usage: node scripts/fix-submit-qc-issue.js [gameId]
 */

import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedev';

async function main() {
  const gameId = process.argv[2];
  
  if (!gameId) {
    console.log('Usage: node scripts/fix-submit-qc-issue.js <gameId>');
    console.log('Example: node scripts/fix-submit-qc-issue.js 6942e6c54f2eae03b502b565');
    process.exit(1);
  }

  if (!ObjectId.isValid(gameId)) {
    console.error('Invalid ObjectId format:', gameId);
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const gamesCollection = db.collection('games');
    const versionsCollection = db.collection('game_versions');

    // Find the game
    console.log(`\n🔍 Looking for game: ${gameId}`);
    const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
    
    if (!game) {
      console.error('❌ Game not found');
      process.exit(1);
    }

    console.log('✅ Game found:');
    console.log(`   Title: ${game.title}`);
    console.log(`   Slug: ${game.gameId}`);
    console.log(`   Owner: ${game.ownerId}`);
    console.log(`   Latest Version ID: ${game.latestVersionId || 'null'}`);
    console.log(`   Live Version ID: ${game.liveVersionId || 'null'}`);
    console.log(`   Created: ${game.createdAt}`);
    console.log(`   Deleted: ${game.isDeleted}`);

    // Find versions for this game
    console.log(`\n🔍 Looking for versions...`);
    const allVersions = await versionsCollection.find({ 
      gameId: new ObjectId(gameId) 
    }).sort({ createdAt: -1 }).toArray();

    const activeVersions = allVersions.filter(v => !v.isDeleted);

    console.log(`📊 Version Summary:`);
    console.log(`   Total versions: ${allVersions.length}`);
    console.log(`   Active versions: ${activeVersions.length}`);
    console.log(`   Deleted versions: ${allVersions.length - activeVersions.length}`);

    if (allVersions.length === 0) {
      console.log('\n❌ No versions found for this game');
      console.log('💡 Solution: Create a version first using POST /api/games/' + gameId + '/upload-version');
      console.log('   Example payload:');
      console.log('   {');
      console.log('     "version": "1.0.0",');
      console.log('     "entryFile": "index.html",');
      console.log('     "releaseNote": "Initial version"');
      console.log('   }');
    } else {
      console.log('\n📋 Versions found:');
      allVersions.forEach((version, index) => {
        const marker = index === 0 ? '📌' : '  ';
        const status = version.isDeleted ? '🗑️ DELETED' : `✅ ${version.status}`;
        console.log(`   ${marker} ${version.version} (${status}) - ${version.createdAt}`);
        console.log(`      ID: ${version._id}`);
        console.log(`      Storage: ${version.storagePath}`);
        if (version.submittedAt) {
          console.log(`      Submitted: ${version.submittedAt}`);
        }
      });

      // Check if game.latestVersionId needs fixing
      if (activeVersions.length > 0 && !game.latestVersionId) {
        const latestVersion = activeVersions[0];
        console.log(`\n🔧 Fix needed: game.latestVersionId is null but versions exist`);
        console.log(`   Should point to: ${latestVersion._id} (${latestVersion.version})`);
        
        // Ask for confirmation
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          rl.question('Fix this issue? (y/N): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          const result = await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            { 
              $set: { 
                latestVersionId: latestVersion._id,
                updatedAt: new Date()
              } 
            }
          );

          if (result.modifiedCount === 1) {
            console.log('✅ Fixed! game.latestVersionId updated');
          } else {
            console.log('❌ Failed to update game.latestVersionId');
          }
        }
      } else if (game.latestVersionId) {
        // Verify the reference is valid
        const referencedVersion = await versionsCollection.findOne({ 
          _id: game.latestVersionId 
        });
        
        if (!referencedVersion) {
          console.log(`\n⚠️  Warning: game.latestVersionId points to non-existent version: ${game.latestVersionId}`);
        } else if (referencedVersion.isDeleted) {
          console.log(`\n⚠️  Warning: game.latestVersionId points to deleted version: ${game.latestVersionId}`);
        } else {
          console.log(`\n✅ game.latestVersionId is valid: ${referencedVersion.version} (${referencedVersion.status})`);
        }
      }
    }

    console.log('\n🎯 Next steps to submit for QC:');
    if (activeVersions.length === 0) {
      console.log('   1. Create a version using /api/games/' + gameId + '/upload-version');
      console.log('   2. Complete Self-QA checklist using /api/games/self-qa');
      console.log('   3. Submit for QC using /api/games/submit-qc');
    } else {
      const latestVersion = activeVersions[0];
      console.log(`   1. Ensure Self-QA is complete for version ${latestVersion.version}`);
      console.log('   2. Call /api/games/submit-qc with:');
      console.log(`      { "gameId": "${gameId}" }`);
      console.log('      or');
      console.log(`      { "versionId": "${latestVersion._id}" }`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);