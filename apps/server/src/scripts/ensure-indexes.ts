import mongoose from 'mongoose';
import { config } from '../config/env';
import Talent from '../models/Talent';

const ensureIndexes = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('📊 Creating indexes for Talent collection...');
    await Talent.syncIndexes();
    console.log('✅ Indexes created successfully');

    const indexes = await Talent.collection.getIndexes();
    console.log('📋 Current indexes:', JSON.stringify(indexes, null, 2));

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

ensureIndexes();
