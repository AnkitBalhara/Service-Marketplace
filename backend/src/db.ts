import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './config';

let mongod: MongoMemoryServer | null = null;

export async function connectToDatabase(): Promise<string> {
  // If already connected, return URI
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }

  // 1. Try connecting to configured MONGODB_URI (e.g. Atlas or local daemon) with short timeout
  if (config.mongoUri && config.mongoUri !== 'mongodb://127.0.0.1:27017/marketplace') {
    try {
      console.log(`[Database] Connecting to external MongoDB at ${config.mongoUri}...`);
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[Database] Connected to external MongoDB.`);
      return config.mongoUri;
    } catch (err: any) {
      console.warn(`[Database] External MongoDB connection failed: ${err.message}. Falling back to embedded in-memory MongoDB.`);
    }
  }

  try {
    // Try local standard port first
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[Database] Connected to local MongoDB instance.`);
    return config.mongoUri;
  } catch {
    // Start embedded MongoMemoryServer
    console.log(`[Database] Starting embedded MongoDB server (zero external dependency mode)...`);
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'marketplace',
      },
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Database] Embedded MongoDB server running and connected at ${uri}.`);
    return uri;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
