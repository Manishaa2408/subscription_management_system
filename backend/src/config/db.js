import mongoose from "mongoose";

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/brightloop_sms";

  try {
    // Attempt standard connection to specified MongoDB URI
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to standard URI (${uri}): ${error.message}`);
    
    // In development mode, fallback to locally runnable embedded MongoDB instance
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log(`[MongoDB] Initializing locally runnable embedded MongoDB for zero-config standalone development...`);
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Successfully connected to locally runnable embedded MongoDB: ${memUri}`);
        return conn;
      } catch (memError) {
        console.error(`[MongoDB] Failed to initialize embedded MongoDB: ${memError.message}`);
      }
    }

    console.error(`[MongoDB] Database connection failed. Please ensure MongoDB is running or reachable.`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error(`Error closing DB: ${err.message}`);
  }
};

export default connectDB;
