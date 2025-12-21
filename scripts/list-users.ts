import "dotenv/config";
import { MongoClient } from "mongodb";

async function listUsers() {
  const uri = process.env.IRUKA_MONGODB_URI;
  if (!uri) {
    console.error("IRUKA_MONGODB_URI is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("iruka-game");
    const users = await db.collection("users").find({}).toArray();

    console.log("--- Users ---");
    users.forEach((u) => {
      console.log(
        `User: ${u.email} | ID: ${u._id} | Roles: ${u.roles?.join(", ")}`
      );
    });
    console.log("--- End ---");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

listUsers();
