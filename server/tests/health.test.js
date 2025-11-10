import request from 'supertest';
import app from '../src/app.js';

describe('Health', () => {
  it('GET /api/health should return OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
