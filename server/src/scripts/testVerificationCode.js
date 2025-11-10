// Test verification code flow
import User from '../models/User.js';
import Role from '../models/Role.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';

async function main() {
  try {
    await connectDB();
    console.log('✓ Connected to DB');

    // Check for Patient role
    const patientRole = await Role.findOne({ name: 'Patient' });
    if (!patientRole) {
      console.log('✗ Patient role not found. Run seed script first.');
      process.exit(1);
    }

    // Clean up test user if exists
    const testEmail = 'verifytest@example.com';
    await User.deleteOne({ email: testEmail });
    console.log('✓ Cleaned up previous test user');

    // Create unverified test user
    const testUser = await User.create({
      name: 'Verification Test',
      email: testEmail,
      password: 'Test@123',
      role: patientRole._id
    });
    console.log('✓ Created test user:', testUser.email);

    // Check initial state
    const user1 = await User.findById(testUser._id).select('+verificationCode +verificationCodeExpiry');
    console.log('\nInitial state:');
    console.log('  isEmailVerified:', user1.isEmailVerified);
    console.log('  verificationCode:', user1.verificationCode || '(none)');
    console.log('  verificationCodeExpiry:', user1.verificationCodeExpiry || '(none)');

    if (!user1.verificationCode) {
      console.log('\n✗ ISSUE: No verification code was generated during signup');
      console.log('  This should be set in authController.register');
    } else {
      console.log('\n✓ Verification code exists');
    }

    // Simulate code validation
    const now = new Date();
    const expiry = user1.verificationCodeExpiry;
    const isExpired = expiry && now > expiry;
    console.log('\nCode validation:');
    console.log('  Current time:', now.toISOString());
    console.log('  Code expiry:', expiry ? expiry.toISOString() : '(none)');
    console.log('  Is expired:', isExpired);

    if (user1.verificationCode && !isExpired) {
      console.log('\n✓ Code is valid and not expired');
      console.log('  Example code to verify:', user1.verificationCode);
      console.log('\nTo test verification, POST to /api/auth/verify-email with:');
      console.log(JSON.stringify({ email: testEmail, code: user1.verificationCode }, null, 2));
    }

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    console.log('\n✓ Test user cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
