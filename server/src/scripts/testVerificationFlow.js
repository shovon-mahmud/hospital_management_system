// Integration test for verification code signup flow
import request from 'supertest';

async function main() {
  try {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

    const { default: app } = await import('../app.js');
    const { connectDB } = await import('../config/db.js');
    await connectDB();

    const testEmail = `test${Date.now()}@verification.test`;
    const testPassword = 'Test@12345';
    let verificationCode = null;

    console.log('\n=== Testing Verification Code Flow ===\n');

    // Step 1: Register
    console.log('Step 1: Register new user');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Code Test User',
        email: testEmail,
        password: testPassword,
        roleName: 'Patient'
      });

    console.log('Status:', registerRes.status);
    if (registerRes.status !== 200) {
      console.error('Registration failed:', registerRes.body);
      process.exit(1);
    }
    console.log('✓ Registration successful');
    console.log('Response:', JSON.stringify(registerRes.body, null, 2));

    // Fetch the user to get the verification code
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: testEmail }).select('+verificationCode +verificationCodeExpiry');
    
    if (!user) {
      console.error('✗ User not found in DB');
      process.exit(1);
    }

    verificationCode = user.verificationCode;
    console.log('\n✓ Found user in DB');
    console.log('  Email:', user.email);
    console.log('  isEmailVerified:', user.isEmailVerified);
    console.log('  verificationCode:', verificationCode);
    console.log('  verificationCodeExpiry:', user.verificationCodeExpiry);

    if (!verificationCode) {
      console.error('\n✗ ERROR: Verification code was not generated!');
      process.exit(1);
    }

    // Step 2: Try login before verification (should fail)
    console.log('\nStep 2: Try login before verification (should fail with 403)');
    const loginBeforeRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    console.log('Status:', loginBeforeRes.status);
    console.log('Message:', loginBeforeRes.body.message);
    if (loginBeforeRes.status === 403) {
      console.log('✓ Login correctly blocked before verification');
    } else {
      console.log('✗ Expected 403, got', loginBeforeRes.status);
    }

    // Step 3: Verify email with code
    console.log('\nStep 3: Verify email with code');
    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: testEmail, code: verificationCode });

    console.log('Status:', verifyRes.status);
    console.log('Response:', JSON.stringify(verifyRes.body, null, 2));
    if (verifyRes.status !== 200) {
      console.error('✗ Verification failed');
      process.exit(1);
    }
    console.log('✓ Email verified successfully');

    // Step 4: Login after verification (should succeed)
    console.log('\nStep 4: Login after verification (should succeed)');
    const loginAfterRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    console.log('Status:', loginAfterRes.status);
    if (loginAfterRes.status === 200) {
      console.log('✓ Login successful after verification');
      console.log('User:', loginAfterRes.body.data.user);
    } else {
      console.error('✗ Login failed:', loginAfterRes.body);
      process.exit(1);
    }

    // Step 5: Test resend code
    console.log('\nStep 5: Test resend verification code');
    // First, unverify the user
    user.isEmailVerified = false;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    const resendRes = await request(app)
      .post('/api/auth/resend-code')
      .send({ email: testEmail });

    console.log('Status:', resendRes.status);
    console.log('Response:', JSON.stringify(resendRes.body, null, 2));
    if (resendRes.status === 200) {
      console.log('✓ Resend code successful');
      const updatedUser = await User.findOne({ email: testEmail }).select('+verificationCode');
      console.log('  New code:', updatedUser.verificationCode);
    }

    // Cleanup
    await User.deleteOne({ email: testEmail });
    console.log('\n✓ Test user cleaned up');

    console.log('\n=== All Tests Passed ===\n');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
