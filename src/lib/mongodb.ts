import 'dotenv/config';
import { MongoClient, type Db } from 'mongodb';

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

/**
 * Get MongoDB client with connection caching (singleton pattern).
 * Reuses existing connection for concurrent requests.
 */
export async function getMongoClient(): Promise<MongoConnection> {
  // Return cached connection if available
  if (cachedConnection) {
    return cachedConnection;
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
  } finally {
    connectionPromise = null;
  }
}

/**
 * Internal function to establish MongoDB connection.
 */
async function connectToMongo(): Promise<MongoConnection> {
  const uri = process.env.IRUKA_MONGODB_URI;

  if (!uri) {
    const error = new Error('[MongoDB] IRUKA_MONGODB_URI environment variable is not set');
    console.error(error.message);
    throw error;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    // Extract database name from URI or use default
    const dbName = extractDbName(uri) || 'iruka-game';
    const db = client.db(dbName);
    
    console.log('[MongoDB] Connected successfully');
    
    return { client, db };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[MongoDB] Connection failed: ${message}`);
    throw error;
  }
}

/**
 * Extract database name from MongoDB URI.
 */
function extractDbName(uri: string): string | null {
  try {
    const url = new URL(uri);
    const pathname = url.pathname;
    // Remove leading slash
    const dbName = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    // Remove query string if present
    return dbName.split('?')[0] || null;
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
    throw new Error('[MongoDB] Not connected. Call getMongoClient() first.');
  }
  return cachedConnection.db;
}

/**
 * Close the MongoDB connection.
 * Useful for graceful shutdown or testing.
 */
export async function closeConnection(): Promise<void> {
  if (cachedConnection) {
    await cachedConnection.client.close();
    cachedConnection = null;
    console.log('[MongoDB] Connection closed');
  }
}
