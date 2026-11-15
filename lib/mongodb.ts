import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "navkarcaretrust";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export class DatabaseConfigurationError extends Error {}

export async function getDatabase(): Promise<Db> {
  if (!uri) {
    throw new DatabaseConfigurationError(
      "MongoDB is not configured. Add MONGODB_URI to .env.local.",
    );
  }

  if (!global.mongoClientPromise) {
    const client = new MongoClient(uri);
    global.mongoClientPromise = client.connect();
  }

  const client = await global.mongoClientPromise;
  return client.db(databaseName);
}
