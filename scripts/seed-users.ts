import 'dotenv/config';
import { getMongoClient, closeConnection } from '../src/lib/mongodb';
import { UserRepository, type Role } from '../src/models/User';

/**
 * Test users to seed
 */
const TEST_USERS: Array<{ email: string; name: string; roles: Role[] }> = [
  { email: 'dev@iruka.com', name: 'Developer User', roles: ['dev'] },
  { email: 'qc@iruka.com', name: 'QC User', roles: ['qc'] },
  { email: 'cto@iruka.com', name: 'CTO User', roles: ['cto'] },
  { email: 'ceo@iruka.com', name: 'CEO User', roles: ['ceo'] },
  { email: 'admin@iruka.com', name: 'Admin User', roles: ['admin'] },
];

async function seedUsers() {
  console.log('🌱 Starting user seed...\n');
  
  let created = 0;
  let skipped = 0;

  try {
    // Connect to MongoDB
    await getMongoClient();
    const userRepo = await UserRepository.getInstance();
    
    // Ensure indexes
    await userRepo.ensureIndexes();
    console.log('✅ Indexes ensured\n');

    // Create each test user
    for (const userData of TEST_USERS) {
      const existing = await userRepo.findByEmail(userData.email);
      
      if (existing) {
        console.log(`⏭️  Skipped: ${userData.email} (already exists)`);
        skipped++;
      } else {
        await userRepo.create(userData);
        console.log(`✅ Created: ${userData.email} (${userData.roles.join(', ')})`);
        created++;
      }
    }

    console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the seed
seedUsers();
