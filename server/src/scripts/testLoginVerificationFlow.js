import request from 'supertest';
import jwt from 'jsonwebtoken';
import { connectDB } from '../config/db.js';
import env from '../config/env.js';
import User from '../models/User.js';
import app from '../app.js';

const TEST_EMAIL = 'testuser@example.com';
const TEST_PASSWORD = 'Test@1234';

async function main() {
  await connectDB();
  // Cleanup any previous test user
  await User.deleteOne({ email: TEST_EMAIL });

  // 1. Register new user
  let res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email: TEST_EMAIL, password: TEST_PASSWORD })
    .set('Accept', 'application/json');
  console.log('Register:', res.status, res.body.message);

  // 2. Try login before verification (should block, send link)
  res = await request(app)
    .post('/api/auth/login')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
    .set('Accept', 'application/json');
  console.log('Login before verify:', res.status, res.body.message);

  // 3. Get verification token from DB
  const user = await User.findOne({ email: TEST_EMAIL }).select('+verificationCode +verificationCodeExpiry');
  const token = user.verificationCode;

  // 4. Verify via link (should succeed)
  res = await request(app)
    .get(`/api/auth/verify-email?token=${token}`)
    .set('Accept', 'application/json');
  console.log('Verify via link:', res.status, res.body.message);

  // 5. Try login after verification (should succeed)
  res = await request(app)
    .post('/api/auth/login')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
    .set('Accept', 'application/json');
  console.log('Login after verify:', res.status, res.body.message);

  // 6. Try verify again (should say already verified)
  res = await request(app)
    .get(`/api/auth/verify-email?token=${token}`)
    .set('Accept', 'application/json');
  console.log('Verify again:', res.status, res.body.message);

  // 7. Try expired token (simulate expiry)
  await User.updateOne({ email: TEST_EMAIL }, { verificationCodeExpiry: new Date(Date.now() - 1000) });
  res = await request(app)
    .get(`/api/auth/verify-email?token=${token}`)
    .set('Accept', 'application/json');
  console.log('Verify expired link:', res.status, res.body.message);

  // 8. Resend verification link (should send new link)
  await User.updateOne({ email: TEST_EMAIL }, { isEmailVerified: false });
  res = await request(app)
    .post('/api/auth/resend-code')
    .send({ email: TEST_EMAIL })
    .set('Accept', 'application/json');
  console.log('Resend link:', res.status, res.body.message);
  const user2 = await User.findOne({ email: TEST_EMAIL }).select('+verificationCode');
  const newToken = user2.verificationCode;

  // 9. Verify with new link (should succeed)
  res = await request(app)
    .get(`/api/auth/verify-email?token=${newToken}`)
    .set('Accept', 'application/json');
  console.log('Verify with resent link:', res.status, res.body.message);

  // 10. Try invalid token
  res = await request(app)
    .get(`/api/auth/verify-email?token=invalidtoken123`)
    .set('Accept', 'application/json');
  console.log('Verify with invalid token:', res.status, res.body.message);

  process.exit(0);
}

main();
