const request = require('supertest');
const app = require('../server');
const api = require('./setup');

describe('AI Analytics API', () => {
  let token = null;
  const userEmail = `analytics_user_${Date.now()}@nitechspark.in`;
  const userPass = 'Analytics#2026!';

  beforeAll(async () => {
    await api.seedUser(userEmail, userPass, 'Super Admin', 'Admin');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPass });
    token = res.body.token;
  });

  it('GET /api/analytics/compliance-score should return score metrics', async () => {
    const res = await request(app)
      .get('/api/analytics/compliance-score')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.score).toBeDefined();
    expect(typeof res.body.score).toBe('number');
  });

  it('POST /api/analytics/ai-insights should return structured intelligence output', async () => {
    const res = await request(app)
      .post('/api/analytics/ai-insights')
      .set('Authorization', `Bearer ${token}`)
      .send({
        context: 'Control: Patch Management. Evidence: Kernel update logs.',
        promptType: 'evidence'
      });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.riskLevel).toBeDefined();
  });
});