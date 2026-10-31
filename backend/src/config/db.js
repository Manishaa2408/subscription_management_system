const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subscription_management';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to standard URI (${uri}): ${error.message}`);

    // In development/test mode, fallback to locally runnable embedded MongoDB instance
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log(`[MongoDB] Initializing locally runnable embedded MongoDB for zero-config execution...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Successfully connected to embedded MongoDB: ${memUri}`);
        return conn;
      } catch (memError) {
        console.error(`[MongoDB] Failed to initialize embedded MongoDB: ${memError.message}`);
      }
    }

    console.error(`[MongoDB] Database connection failed. Please ensure MongoDB is running or reachable.`);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error(`Error closing DB: ${err.message}`);
  }
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.closeDB = closeDB;
module.exports.disconnectDB = closeDB;
module.exports.default = connectDB;
