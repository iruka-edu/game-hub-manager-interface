import "dotenv/config";
import { MongoClient } from "mongodb";

async function list() {
  const uri = process.env.IRUKA_MONGODB_URI;
  if (!uri) {
    console.error("IRUKA_MONGODB_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    console.log(`Connected to database: ${db.databaseName}`);

    const collections = await db.listCollections().toArray();
    console.log("--- Collections ---");
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`- ${coll.name}: ${count} documents`);
    }
    console.log("--- End ---");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

list();
