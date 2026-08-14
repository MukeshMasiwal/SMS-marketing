import mongoose from "mongoose";

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
      "❌ MongoDB connection failed: MONGODB_URI environment variable is missing in .env.local"
    );
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🔄 Attempting MongoDB connection...");
    console.log("🔗 Connecting to MongoDB Atlas...");

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
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
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
