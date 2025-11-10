import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import '../models/Role.js';

function classify(user) {
  if (user.isEmailVerified) return 'verified';
  if (user.isEmailVerified === undefined) return 'legacy_no_flag';
  if (!user.verificationCode && !user.verificationCodeExpiry) return 'unverified_no_token';
  if (user.verificationCode && /^\d{6}$/.test(user.verificationCode)) return 'legacy_code';
  if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) return 'link_expired';
  return 'link_active';
}

async function main() {
  await connectDB();
  const users = await User.find({}).select('+verificationCode +verificationCodeExpiry').populate('role');
  const counts = {};
  const samples = {};
  for (const u of users) {
    const c = classify(u);
    counts[c] = (counts[c] || 0) + 1;
    if (!samples[c]) {
      samples[c] = {
        email: u.email,
        role: u.role?.name,
        isEmailVerified: u.isEmailVerified,
        verificationCode: u.verificationCode,
        verificationCodeExpiry: u.verificationCodeExpiry,
      };
    }
  }
  console.log('User Verification Classification Summary');
  console.table(Object.entries(counts).map(([state, total]) => ({ state, total })));
  console.log('Sample Documents Per State');
  console.log(samples);
  process.exit(0);
}

main();
