const mongoose = require('mongoose');
const config = require('./env');

let memServer = null;

const connectDB = async () => {
  try {
    const opts = {
      serverSelectionTimeoutMS: 2000
    };

    try {
      await mongoose.connect(config.mongoUri, opts);
      console.log(`[DB] Connected to MongoDB at: ${config.mongoUri}`);
    } catch (primaryError) {
      console.warn(`[DB] Primary MongoDB connection failed (${primaryError.message}). Initializing embedded memory database for zero-config operation...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memServer = await MongoMemoryServer.create();
      const memUri = memServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[DB] Connected to in-memory MongoDB at: ${memUri}`);
    }

    mongoose.connection.on('error', (err) => {
      console.error('[DB] Connection error:', err.message);
    });

    return mongoose.connection;
  } catch (err) {
    console.error('[DB] Fatal database connection error:', err);
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
