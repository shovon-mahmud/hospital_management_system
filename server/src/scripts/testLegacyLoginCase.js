import request from 'supertest';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

async function main() {
  await connectDB();

  // Setup a legacy user with uppercase email
  const EMAIL = 'LEGACY.UPPER@EXAMPLE.COM';
  const PASSWORD = 'Str0ng@Pass1';

  const role = await Role.findOne({ name: 'Patient' });

  await User.deleteMany({ email: /LEGACY\.UPPER@EXAMPLE\.COM/i });
  const user = await User.create({ name: 'Legacy Upper', email: EMAIL, password: PASSWORD, role: role._id });

  // Force legacy-like doc (no isEmailVerified field)
  await User.updateOne({ _id: user._id }, { $unset: { isEmailVerified: 1 } });

  // Try login with lowercased email
  let res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL.toLowerCase(), password: PASSWORD })
    .set('Accept', 'application/json');
  console.log('Lowercase login status:', res.status, res.body.message);

  // Now login again (should pass as verified now)
  res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .set('Accept', 'application/json');
  console.log('Uppercase login status:', res.status, res.body.message);

  process.exit(0);
}

main();
