import mongoose from 'mongoose';
import { config } from './env';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    } else {
      console.error(`💥 Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
      process.exit(1);
    }
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during MongoDB disconnection:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default connectDB;
