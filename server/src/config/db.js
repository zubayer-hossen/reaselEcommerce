import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  if (!env.mongoUri) {
    console.warn('[db] MONGO_URI not set — starting without database');
    return false;
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log('[db] MongoDB connected');
  return true;
}
