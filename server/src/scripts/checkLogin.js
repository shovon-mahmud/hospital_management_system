import 'dotenv/config';
import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/User.js';
import '../models/Role.js';

const run = async () => {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  const user = await User.findOne({ email: 'admin@hms.bd' }).select('+password').populate('role');
    if (!user) throw new Error('Admin not found');
    const ok = await user.comparePassword('Admin@123');
    console.log('Password match:', ok);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
};

run();
