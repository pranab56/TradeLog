import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

/**
 * Returns a database instance for a specific user or the main auth database.
 * @param dbName Optional name of the database. If not provided, returns the default 'tradelog_main' database.
 */
export async function getDb(dbName: string = 'tradelog_main') {
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * Helper to get the isolated database for a specific user.
 * Each user has their own database name stored in their account.
 */
export async function getUserDb(dbName: string) {
  if (!dbName) throw new Error('Database name is required for isolated access');
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;

