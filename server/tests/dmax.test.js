const request = require('supertest');
const app = require('../server');
const crypto = require('crypto');

describe('DMAX API', () => {
  let token = null;
  let userId = null;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@desicrew.in', password: 'password123' });
    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('POST /api/dmax', () => {
    it('should create new DMAX ticket', async () => {
      const dmax = {
        id: 'test-dmax-' + crypto.randomBytes(4).toString('hex'),
        ticketId: 'DMAX-' + Date.now(),
        department: 'IT',
        description: 'Test DMAX ticket',
        severity: 'Medium',
        reportedBy: userId,
        reportedAt: new Date().toISOString(),
        status: 'Open'
      };

      const res = await request(app)
        .post('/api/dmax')
        .set('Authorization', `Bearer ${token}`)
        .send(dmax);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/dmax')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/dmax/:id', () => {
    let dmaxId = null;

    beforeAll(async () => {
      dmaxId = 'test-dmax-' + crypto.randomBytes(4).toString('hex');
      await request(app)
        .post('/api/dmax')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: dmaxId,
          ticketId: 'DMAX-' + Date.now(),
          department: 'IT',
          description: 'Test DMAX',
          severity: 'High',
          reportedBy: userId,
          reportedAt: new Date().toISOString(),
          status: 'Open'
        });
    });

    it('should update DMAX status', async () => {
      const res = await request(app)
        .put(`/api/dmax/${dmaxId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Resolved', resolvedAt: new Date().toISOString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should assign DMAX to user', async () => {
      const assignId = 'test-dmax-' + crypto.randomBytes(4).toString('hex');
      await request(app)
        .post('/api/dmax')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: assignId,
          ticketId: 'DMAX-' + Date.now(),
          department: 'IT',
          description: 'Test DMAX assign',
          severity: 'Low',
          reportedBy: userId,
          reportedAt: new Date().toISOString(),
          status: 'Open'
        });

      const res = await request(app)
        .put(`/api/dmax/${assignId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assignedTo: userId });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/data', () => {
    it('should return all DMAX reports', async () => {
      const res = await request(app)
        .get('/api/data');

      expect(res.status).toBe(200);
      expect(res.body.dmax).toBeDefined();
      expect(Array.isArray(res.body.dmax)).toBe(true);
    });
  });
});