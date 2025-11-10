#!/usr/bin/env node
import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import '../models/Role.js';

function ciRegex(email) {
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

function parseArgs() {
  const args = process.argv.slice(2);
  let email = null; let password = null; let verify = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--email') { email = args[++i]; }
    else if (a === '--password') { password = args[++i]; }
    else if (a === '--verify') { verify = true; }
  }
  if (!email || !password) {
    console.log('Usage: node src/scripts/resetUserPassword.js --email user@example.com --password NewPass!23 [--verify]');
    process.exit(1);
  }
  return { email, password, verify };
}

async function main() {
  const { email, password, verify } = parseArgs();
  await connectDB();

  const user = await User.findOne({ email: ciRegex(email) }).select('+password +verificationCode +verificationCodeExpiry');
  if (!user) {
    console.error('User not found for', email);
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  if (verify) {
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
  }
  await user.save();
  console.log('Updated user password', { email: user.email, verified: user.isEmailVerified });
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
