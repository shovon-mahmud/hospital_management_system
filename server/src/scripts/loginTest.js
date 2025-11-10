import request from 'supertest'

const email = process.env.TEST_EMAIL || 'admin@hms.bd'
const password = process.env.TEST_PASSWORD || 'Admin@123'

async function main() {
  try {
    // Ensure JWT secrets exist for signing during this ad-hoc test
    if (!process.env.JWT_ACCESS_SECRET) process.env.JWT_ACCESS_SECRET = 'test-access-secret'
    if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

    const { connectDB } = await import('../config/db.js')
    const { default: app } = await import('../app.js')
    await connectDB()
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .set('Accept', 'application/json')
    console.log('Status:', res.status)
    console.log('Body:', JSON.stringify(res.body, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
