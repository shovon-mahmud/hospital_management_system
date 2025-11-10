import request from 'supertest';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

async function main() {
  await connectDB();

  const baseEmail = 'regtester@example.com';
  const strongPassword = 'Str0ng@Pass';

  // Ensure clean state
  await User.deleteMany({ email: baseEmail });

  console.log('\n--- Registration Scenarios ---');

  // 1. Successful registration
  let res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Reg Tester', email: baseEmail, password: strongPassword })
    .set('Accept', 'application/json');
  console.log('1 Success registration:', res.status, res.body.message);

  // Fetch created user
  const user = await User.findOne({ email: baseEmail });

  // 2. Duplicate email registration
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Reg Tester 2', email: baseEmail, password: strongPassword })
    .set('Accept', 'application/json');
  console.log('2 Duplicate email:', res.status, res.body.message);

  // 3. Missing password
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'No Pass', email: 'nopass@example.com' })
    .set('Accept', 'application/json');
  console.log('3 Missing password:', res.status, res.body.message);

  // 4. Invalid email format
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bad Email', email: 'invalid-email', password: strongPassword })
    .set('Accept', 'application/json');
  console.log('4 Invalid email:', res.status, res.body.message);

  // 5. Weak password
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Weak Pass', email: 'weakpass@example.com', password: 'abc123' })
    .set('Accept', 'application/json');
  console.log('5 Weak password:', res.status, res.body.message);

  // 6. Patient profile auto-creation
  const patientEmail = 'patientprofile@example.com';
  await User.deleteMany({ email: patientEmail });
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Patient User', email: patientEmail, password: strongPassword, roleName: 'Patient', patientData: { gender: 'Male', contact: { phone: '1234567890' } } })
    .set('Accept', 'application/json');
  console.log('6 Patient registration:', res.status, res.body.message);
  const patientUser = await User.findOne({ email: patientEmail });
  const patientProfile = await Patient.findOne({ user: patientUser?._id });
  console.log('   Patient profile exists:', !!patientProfile);

  // 7. Re-registration attempt with different case email (should still conflict if case-insensitive)
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Case Conflict', email: baseEmail.toUpperCase(), password: strongPassword })
    .set('Accept', 'application/json');
  console.log('7 Case-insensitive duplicate:', res.status, res.body.message);

  // 8. Verify that unverified user cannot login
  res = await request(app)
    .post('/api/auth/login')
    .send({ email: baseEmail, password: strongPassword })
    .set('Accept', 'application/json');
  console.log('8 Login before verification:', res.status, res.body.message);

  // Done
  process.exit(0);
}

main();
