/**
 * Script to sync games from Registry to MongoDB
 * Run this once to create Game records for existing games
 *
 * Usage: npx tsx scripts/sync-games-to-mongodb.ts
 */

import { RegistryManager } from "../src/lib/registry";
import { GameRepository } from "../src/models/Game";
import { UserRepository } from "../src/models/User";

async function syncGames() {
  console.log("Starting game sync from Registry to MongoDB...\n");

  try {
    // Get all games from registry
    const registry = await RegistryManager.get();
    const registryGames = registry.games || [];

    console.log(`Found ${registryGames.length} games in Registry\n`);

    // Get repositories
    const gameRepo = await GameRepository.getInstance();
    const userRepo = await UserRepository.getInstance();

    // Get first admin user as default owner
    const users = await userRepo.findAll();
    const adminUser = users.find((u) => u.roles.includes("admin"));
    const devUser = users.find((u) => u.roles.includes("dev"));
    const defaultOwner = adminUser || devUser || users[0];

    if (!defaultOwner) {
      console.error("No users found in database. Please create a user first.");
      process.exit(1);
    }

    console.log(`Using default owner: ${defaultOwner.email}\n`);

    let created = 0;
    let skipped = 0;

    for (const regGame of registryGames) {
      const gameId = regGame.id;

      // Check if game already exists in MongoDB
      const existing = await gameRepo.findByGameId(gameId);

      if (existing) {
        console.log(`[SKIP] ${gameId} - already exists in MongoDB`);
        skipped++;
        continue;
      }

      // Create new game record
      try {
        await gameRepo.create({
          gameId: gameId,
          title: regGame.title || gameId,
          description: (regGame.manifest as any)?.description || "",
          ownerId: defaultOwner._id.toString(),
        } as any);

        console.log(`[CREATE] ${gameId} - created in MongoDB`);
        created++;
      } catch (error: any) {
        console.error(`[ERROR] ${gameId} - ${error.message}`);
      }
    }

    console.log(`\n=== Sync Complete ===`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${registryGames.length}`);
  } catch (error) {
    console.error("Sync failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

syncGames();
