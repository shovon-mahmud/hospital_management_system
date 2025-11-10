import 'dotenv/config';
import mongoose from 'mongoose';
import env from '../config/env.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

const run = async () => {
  try {
    console.log('Connecting to', env.mongoUri);
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });

    const [roles, users, patients, doctors] = await Promise.all([
      Role.countDocuments(),
      User.countDocuments(),
      Patient.countDocuments(),
      Doctor.countDocuments()
    ]);

    const admin = await User.findOne({ email: 'admin@hms.local' }).populate('role');

    console.log('Counts:', { roles, users, patients, doctors });
    if (admin) {
      console.log('Admin user found:', { id: admin._id.toString(), email: admin.email, role: admin.role?.name, verified: admin.isEmailVerified });
    } else {
      console.log('Admin user NOT found');
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
};

run();
