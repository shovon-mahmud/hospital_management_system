import request from 'supertest';
import { connectDB } from '../config/db.js';
import app from '../app.js';

async function main() {
  await connectDB();

  const tests = [
    { email: 'admin@hms.bd', password: 'Admin@123' },
    { email: 'hr@hms.bd', password: 'Pass@123' },
    { email: 'reception@hms.bd', password: 'Pass@123' },
    { email: 'dr.nami@hms.bd', password: 'Pass@123' },
    { email: 'chitoge@example.bd', password: 'Pass@123' }
  ];

  for (const t of tests) {
    const res = await request(app).post('/api/auth/login').send(t).set('Accept','application/json');
    console.log(`${t.email} ->`, res.status, res.body.message);
  }

  process.exit(0);
}

main();
