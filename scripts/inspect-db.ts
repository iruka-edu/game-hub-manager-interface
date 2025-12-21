import "dotenv/config";
import { MongoClient } from "mongodb";

async function inspect() {
  const uri = process.env.IRUKA_MONGODB_URI;
  if (!uri) {
    console.error("IRUKA_MONGODB_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("iruka-game");
    const games = await db.collection("games").find({}).limit(5).toArray();

    console.log("--- Games Inspection ---");
    games.forEach((g) => {
      console.log(`Game: ${g.gameId}`);
      console.log(
        `  ownerId: ${g.ownerId} (Type: ${typeof g.ownerId}, IsObjectId: ${
          g.ownerId?._bsontype === "ObjectID" ||
          g.ownerId?._bsontype === "ObjectId"
        })`
      );
    });
    console.log("--- End Inspection ---");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

inspect();
