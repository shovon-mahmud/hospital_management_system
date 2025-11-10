import request from 'supertest';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

async function main() {
  await connectDB();

  const EMAIL = 'verified@example.com';
  const PASSWORD = 'Str0ng@Pass1';

  const role = await Role.findOne({ name: 'Patient' });
  await User.deleteMany({ email: /verified@example\.com/i });

  // Create verified user
  const user = await User.create({ name: 'Verified User', email: EMAIL, password: PASSWORD, role: role._id, isEmailVerified: true });

  // Happy path login
  let res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .set('Accept', 'application/json');
  console.log('Login verified user:', res.status, res.body.message);

  // Wrong password
  res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: 'WrongPass1!' })
    .set('Accept', 'application/json');
  console.log('Login wrong password:', res.status, res.body.message);

  // Non-existent email
  res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'noone@example.com', password: PASSWORD })
    .set('Accept', 'application/json');
  console.log('Login non-existent:', res.status, res.body.message);

  process.exit(0);
}

main();
