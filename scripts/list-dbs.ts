import "dotenv/config";
import { MongoClient } from "mongodb";

async function listDbs() {
  const uri = process.env.IRUKA_MONGODB_URI;
  if (!uri) {
    console.error("IRUKA_MONGODB_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    console.log("--- Databases ---");
    dbs.databases.forEach((db) => console.log(`- ${db.name}`));
    console.log("--- End ---");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

listDbs();
