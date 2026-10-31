const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brightloop_sms';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.warn(`[Database] Standard MongoDB connection failed: ${err.message}`);

    // Fallback: in-memory MongoDB for hackathon / development
    try {
      console.log('[Database] Initializing fallback in-memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-memory MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (fallbackErr) {
      console.error('[Database] Fallback in-memory MongoDB failed:', fallbackErr.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
