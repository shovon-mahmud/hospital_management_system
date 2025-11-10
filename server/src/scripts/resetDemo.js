import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

// This script drops the current MongoDB database and then re-runs the demo seed.
// Usage: npm run reset:demo

const main = async () => {
  try {
    await connectDB();
  const db = mongoose.connection;
  const dbName = db?.db?.databaseName || process.env.MONGO_DB_NAME || '<unknown>';

    console.log('⚠️  About to DROP database:', dbName);
    if (!db || db.readyState !== 1) {
      throw new Error('Not connected to MongoDB');
    }

    // Drop the entire database
    await db.dropDatabase();
    console.log('🗑️  Database dropped successfully.');

    // Disconnect to ensure a clean re-connect for the seed script
    await mongoose.disconnect();
    console.log('🔌 Disconnected. Re-running seed...');

    // Dynamically import the seed script which will connect and populate data.
    // Note: seed.js will call process.exit(0) on success.
    await import('./seed.js');
  } catch (err) {
    console.error('❌ Reset failed:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.warn('⚠️  Failed to disconnect after error:', e?.message || e);
    }
    process.exit(1);
  }
};

main();
