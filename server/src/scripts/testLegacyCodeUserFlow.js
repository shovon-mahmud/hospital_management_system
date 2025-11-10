import request from 'supertest';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

async function main() {
  await connectDB();
  const EMAIL = 'legacycode@example.com';
  const PASSWORD = 'Str0ng@Pass1';
  const role = await Role.findOne({ name: 'Patient' });

  await User.deleteMany({ email: /legacycode@example\.com/i });
  // Create user with legacy 6-digit code
  const user = await User.create({ name: 'Legacy Code', email: EMAIL, password: PASSWORD, role: role._id, isEmailVerified: false, verificationCode: '123456', verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000) });

  // Attempt login (should convert to link and return 403)
  let res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .set('Accept', 'application/json');
  console.log('Login with legacy code:', res.status, res.body.message);

  // Pull new token from DB
  const updated = await User.findById(user._id).select('+verificationCode +verificationCodeExpiry');
  const token = updated.verificationCode;
  console.log('Token is JWT-like:', token && token.split('.').length === 3);

  // Verify via link
  res = await request(app)
    .get(`/api/auth/verify-email?token=${token}`)
    .set('Accept', 'application/json');
  console.log('Verify after conversion:', res.status, res.body.message);

  // Login should now succeed
  res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .set('Accept', 'application/json');
  console.log('Login after verify:', res.status, res.body.message);

  process.exit(0);
}

main();
