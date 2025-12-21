import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

/**
 * Script to fix missing ownerId in the games collection.
 *
 * Logic:
 * 1. Find all games missing ownerId or having empty ownerId.
 * 2. For each such game, look at its GameVersion records.
 * 3. Use the most recent version's 'submittedBy' as the ownerId.
 * 4. If no versions found, fallback to the first admin user.
 */

async function patch() {
  const uri = process.env.IRUKA_MONGODB_URI;
  if (!uri) {
    console.error("IRUKA_MONGODB_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("iruka-game");
    const gamesColl = db.collection("games");
    const versionsColl = db.collection("game_versions");
    const usersColl = db.collection("users");

    // 1. Find an admin user for fallback
    const adminUser = await usersColl.findOne({ roles: "admin" });
    if (!adminUser) {
      console.error("No admin user found for fallback");
      // We'll continue but might fail if fallback needed
    }

    // 2. Find games with missing ownerId
    const gamesToFix = await gamesColl
      .find({
        $or: [
          { ownerId: { $exists: false } },
          { ownerId: null },
          { ownerId: "" },
        ],
      })
      .toArray();

    console.log(`Found ${gamesToFix.length} games to fix`);

    for (const game of gamesToFix) {
      console.log(`Processing game: ${game.gameId} (${game.title})`);

      // Try to find versions to get an owner
      const versions = await versionsColl
        .find({ gameId: game._id })
        .sort({ submittedAt: -1 })
        .limit(1)
        .toArray();

      let newOwnerId = "";

      if (versions.length > 0 && versions[0].submittedBy) {
        newOwnerId = versions[0].submittedBy.toString();
        console.log(`  Found owner from version: ${newOwnerId}`);
      } else if (adminUser) {
        newOwnerId = adminUser._id.toString();
        console.log(`  Falling back to admin owner: ${newOwnerId}`);
      }

      if (newOwnerId) {
        const result = await gamesColl.updateOne(
          { _id: game._id },
          { $set: { ownerId: newOwnerId, updatedAt: new Date() } }
        );
        if (result.modifiedCount === 1) {
          console.log(`  ✓ Successfully updated`);
        } else {
          console.log(`  ✗ Failed to update`);
        }
      } else {
        console.log(`  ! Could not determine owner for this game`);
      }
    }

    console.log("Patch completed");
  } catch (error) {
    console.error("Error during patch:", error);
  } finally {
    await client.close();
  }
}

patch();
