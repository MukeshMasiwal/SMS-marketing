import mongoose from "mongoose";
import { ensureDemoAccountsSeeded } from "./seed-utils";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error(
      "❌ MongoDB connection failed: MONGODB_URI environment variable is missing"
    );
    throw new Error(
      "Please define the MONGODB_URI environment variable"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🔄 Attempting MongoDB connection...");
    console.log("🔗 Connecting to MongoDB Atlas...");

    const opts = {
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(async (mongooseInstance) => {
        const dbName =
          mongooseInstance.connection.db?.databaseName ||
          mongooseInstance.connection.name ||
          "sms-marketing";
        console.log(`✅ MongoDB Atlas connected (${dbName})`);

        return mongooseInstance;
      })
      .catch((error: unknown) => {
        cached.promise = null;
        const safeErrorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`❌ MongoDB connection failed: ${safeErrorMessage}`);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    // Ensure demo accounts exist idempotently in production MongoDB (non-blocking safety)
    try {
      await ensureDemoAccountsSeeded();
    } catch (seedErr: any) {
      console.warn(`⚠️ Non-fatal demo account seed warning: ${seedErr?.message || seedErr}`);
    }
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
