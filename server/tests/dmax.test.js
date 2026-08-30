const request = require('supertest');
const app = require('../server');
const crypto = require('crypto');
const api = require('./setup');

describe('DMAX API', () => {
  let token = null;
  let userId = null;
  const dmaxEmail = `dmax_${Date.now()}@nitechspark.in`;
  const dmaxPass = 'DmaxSecure#2026!';

  beforeAll(async () => {
    const user = await api.seedUser(dmaxEmail, dmaxPass, 'Super Admin', 'IT');
    userId = user.id;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: dmaxEmail, password: dmaxPass });
    token = res.body.token;
  });

  describe('GET /api/data', () => {
    it('should return all DMAX reports for authenticated user', async () => {
      const res = await request(app)
        .get('/api/data')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.dmax).toBeDefined();
      expect(Array.isArray(res.body.dmax)).toBe(true);
    });
  });
});