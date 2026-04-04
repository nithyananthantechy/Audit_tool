const request = require('supertest');
const app = require('../server');

describe('AI Analytics API', () => {
  let token = null;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@desicrew.in', password: 'password123' });
    token = res.body.token;
  });

  describe('GET /api/analytics/compliance-score', () => {
    it('should return compliance score for user department', async () => {
      const res = await request(app)
        .get('/api/analytics/compliance-score')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBeDefined();
      expect(res.body.submissionScore).toBeDefined();
      expect(res.body.approvalScore).toBeDefined();
      expect(typeof res.body.score).toBe('number');
    });

    it('should accept department parameter', async () => {
      const res = await request(app)
        .get('/api/analytics/compliance-score?department=IT')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/analytics/compliance-score');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/analytics/department-comparison', () => {
    it('should return department comparison data', async () => {
      const res = await request(app)
        .get('/api/analytics/department-comparison')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].department).toBeDefined();
        expect(res.body[0].score).toBeDefined();
      }
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/analytics/department-comparison');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/analytics/anomalies', () => {
    it('should return anomaly detection results', async () => {
      const res = await request(app)
        .get('/api/analytics/anomalies')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].type).toBeDefined();
        expect(res.body[0].severity).toBeDefined();
        expect(res.body[0].message).toBeDefined();
      }
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/analytics/anomalies');

      expect(res.status).toBe(401);
    });
  });
});