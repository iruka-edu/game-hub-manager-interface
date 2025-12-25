import 'dotenv/config';
import { getMongoClient, closeConnection } from '../src/lib/mongodb';
import bcrypt from 'bcryptjs';

/**
 * Migration script to add passwords and isActive field to existing users
 */

const USER_PASSWORDS: Record<string, string> = {
  'dev@iruka.com': 'dev123',
  'qc@iruka.com': 'qc123',
  'cto@iruka.com': 'cto123',
  'ceo@iruka.com': 'ceo123',
  'admin@iruka.com': 'admin123',
};

async function migrateUsers() {
  console.log('🔄 Starting user migration...\n');
  
  let updated = 0;
  let skipped = 0;

  try {
    // Connect to MongoDB
    const { db } = await getMongoClient();
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to migrate\n`);

    for (const user of users) {
      const email = user.email;
      
      // Check if user already has passwordHash
      if (user.passwordHash) {
        console.log(`⏭️  Skipped: ${email} (already has password)`);
        skipped++;
        continue;
      }

      // Get password for this user
      const password = USER_PASSWORDS[email];
      if (!password) {
        console.log(`⚠️  Warning: No password defined for ${email}, skipping`);
        skipped++;
        continue;
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update user with password and isActive field
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            passwordHash,
            isActive: true,
            updatedAt: new Date()
          } 
        }
      );

      console.log(`✅ Updated: ${email} (added password and isActive)`);
      updated++;
    }

    console.log(`\n📊 Summary: ${updated} updated, ${skipped} skipped`);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the migration
migrateUsers();
