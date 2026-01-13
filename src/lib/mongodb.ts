import "dotenv/config";
import { MongoClient, type Db } from "mongodb";

/**
 * MongoDB connection module with singleton pattern and connection caching.
 * Ensures only one connection is reused across all requests.
 */

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

// Cached connection (singleton)
let cachedConnection: MongoConnection | null = null;

// Connection promise to prevent race conditions during concurrent requests
let connectionPromise: Promise<MongoConnection> | null = null;

// Track if we've already logged successful connection
let hasLoggedConnection = false;

/**
 * Get MongoDB client with connection caching (singleton pattern).
 * Reuses existing connection for concurrent requests.
 */
export async function getMongoClient(): Promise<MongoConnection> {
  // Check if cached connection is still alive
  if (cachedConnection) {
    try {
      await cachedConnection.db.admin().ping();
      return cachedConnection;
    } catch (error) {
      console.warn(
        "[MongoDB] Cached connection is stale, reconnecting...",
        error
      );
      cachedConnection = null;
    }
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  connectionPromise = connectToMongo();

  try {
    cachedConnection = await connectionPromise;
    return cachedConnection;
  } catch (error) {
    // Reset connection promise on failure
    connectionPromise = null;
    throw error;
  } finally {
    // Only reset if successful (cachedConnection is set)
    if (cachedConnection) {
      connectionPromise = null;
    }
  }
}

/**
 * Internal function to establish MongoDB connection.
 */
async function connectToMongo(): Promise<MongoConnection> {
  const uri = process.env.IRUKA_MONGODB_URI;

  if (!uri) {
    const error = new Error(
      "[MongoDB] IRUKA_MONGODB_URI environment variable is not set"
    );
    console.error(error.message);
    throw error;
  }

  // Retry configuration
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MongoDB] Connection attempt ${attempt}/${maxRetries}...`);

      // Improved connection options for better reliability
      const client = new MongoClient(uri, {
        maxPoolSize: 10, // Maximum number of connections in the pool
        minPoolSize: 1, // Minimum number of connections in the pool
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 15000, // Increased to 15 seconds
        socketTimeoutMS: 45000, // How long a send or receive on a socket can take
        connectTimeoutMS: 15000, // Increased to 15 seconds
        heartbeatFrequencyMS: 10000, // How often to check the server status
        retryWrites: true, // Retry writes on network errors
        retryReads: true, // Retry reads on network errors
        compressors: ["zlib"], // Enable compression
      });

      // Connect with timeout
      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout after 15 seconds")),
            15000
          )
        ),
      ]);

      // Test the connection
      await client.db().admin().ping();

      // Extract database name from URI or use default
      const dbName = extractDbName(uri) || "iruka-game";
      const db = client.db(dbName);

      // Only log once to avoid spam
      if (!hasLoggedConnection) {
        console.log(
          `[MongoDB] Connected successfully on attempt ${attempt} with connection pooling`
        );
        hasLoggedConnection = true;
      }

      return { client, db };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[MongoDB] Connection attempt ${attempt} failed: ${lastError.message}`
      );

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`[MongoDB] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  const finalError = new Error(
    `[MongoDB] Failed to connect after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
  console.error(finalError.message);
  throw finalError;
}

/**
 * Extract database name from MongoDB URI.
 */
function extractDbName(uri: string): string | null {
  try {
    const url = new URL(uri);
    const pathname = url.pathname;
    // Remove leading slash
    const dbName = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    // Remove query string if present
    return dbName.split("?")[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get the database instance directly.
 * Throws if not connected yet - use getMongoClient() first.
 */
export function getDb(): Db {
  if (!cachedConnection) {
    throw new Error("[MongoDB] Not connected. Call getMongoClient() first.");
  }
  return cachedConnection.db;
}

/**
 * Close the MongoDB connection.
 * Useful for graceful shutdown or testing.
 */
export async function closeConnection(): Promise<void> {
  if (cachedConnection) {
    try {
      await cachedConnection.client.close();
    } catch (error) {
      console.warn("[MongoDB] Error closing connection:", error);
    }
    cachedConnection = null;
    connectionPromise = null;
    hasLoggedConnection = false;
    console.log("[MongoDB] Connection closed");
  }
}

/**
 * Force reconnect to MongoDB.
 * Useful when connection issues are detected.
 */
export async function forceReconnect(): Promise<MongoConnection> {
  console.log("[MongoDB] Forcing reconnection...");
  await closeConnection();
  return getMongoClient();
}

/**
 * Health check for MongoDB connection
 */
export async function isConnected(): Promise<boolean> {
  try {
    if (!cachedConnection) return false;

    // Ping the database to check if connection is alive
    await cachedConnection.db.admin().ping();
    return true;
  } catch (error) {
    console.warn("[MongoDB] Health check failed:", error);
    return false;
  }
}
