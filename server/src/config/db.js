import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err.message);
    process.exit(1);
  }
};
