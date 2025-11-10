import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import '../models/Role.js';

function ciRegex(email) {
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.log('Usage: node src/scripts/diagnoseLogin.js <email> <password>');
    process.exit(1);
  }

  await connectDB();

  const email = emailArg.trim();
  const password = passwordArg;

  const user = await User.findOne({ email: ciRegex(email) })
    .select('+password +verificationCode +verificationCodeExpiry')
    .populate('role');

  if (!user) {
    console.log('Result: NOT_FOUND');
    process.exit(0);
  }

  // Basic info
  console.log('User:', {
    id: user._id.toString(),
    email: user.email,
    role: user.role?.name,
    isEmailVerified: user.isEmailVerified,
    hasVerificationCode: !!user.verificationCode,
    verificationCodeExpiry: user.verificationCodeExpiry ? user.verificationCodeExpiry.toISOString() : null,
  });

  // Password check
  const pwdOk = await bcrypt.compare(password, user.password);
  console.log('Password match:', pwdOk);

  // Verification state
  let verificationState = 'verified';
  if (user.isEmailVerified === false) {
    if (!user.verificationCode || !user.verificationCodeExpiry) {
      verificationState = 'unverified_no_link';
    } else if (new Date() > user.verificationCodeExpiry) {
      verificationState = 'unverified_link_expired';
    } else {
      verificationState = 'unverified_link_active';
    }
  } else if (user.isEmailVerified === undefined) {
    verificationState = 'legacy_no_flag';
  }
  console.log('Verification state:', verificationState);

  // Possible diagnosis
  if (!pwdOk) {
    console.log('Diagnosis: Invalid credentials (password mismatch).');
  } else if (verificationState.startsWith('unverified')) {
    console.log('Diagnosis: Account not verified. Login will return 403 until verified.');
  } else {
    console.log('Diagnosis: Account should be able to log in successfully.');
  }

  process.exit(0);
}

main();
