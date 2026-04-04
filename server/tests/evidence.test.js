const request = require('supertest');
const app = require('../server');
const crypto = require('crypto');

describe('Evidence API', () => {
  let token = null;
  let userId = null;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@desicrew.in', password: 'password123' });
    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('POST /api/evidence', () => {
    it('should create new evidence submission', async () => {
      const evidence = {
        id: 'test-ev-' + crypto.randomBytes(4).toString('hex'),
        userId: userId,
        userName: 'Test User',
        department: 'IT',
        checklistId: 'it1',
        description: 'Test evidence submission',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        submittedAt: new Date().toISOString(),
        status: 'Pending'
      };

      const res = await request(app)
        .post('/api/evidence')
        .set('Authorization', `Bearer ${token}`)
        .send(evidence);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/evidence')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/evidence/:id', () => {
    let evidenceId = null;

    beforeAll(async () => {
      evidenceId = 'test-ev-' + crypto.randomBytes(4).toString('hex');
      await request(app)
        .post('/api/evidence')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: evidenceId,
          userId: userId,
          userName: 'Test User',
          department: 'IT',
          checklistId: 'it1',
          description: 'Test evidence',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          submittedAt: new Date().toISOString(),
          status: 'Pending'
        });
    });

    it('should approve evidence', async () => {
      const res = await request(app)
        .put(`/api/evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Manager Approved' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject evidence', async () => {
      const rejectId = 'test-ev-' + crypto.randomBytes(4).toString('hex');
      await request(app)
        .post('/api/evidence')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: rejectId,
          userId: userId,
          userName: 'Test User',
          department: 'IT',
          checklistId: 'it1',
          description: 'Test evidence',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          submittedAt: new Date().toISOString(),
          status: 'Pending'
        });

      const res = await request(app)
        .put(`/api/evidence/${rejectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Rejected' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/data', () => {
    it('should return all evidence', async () => {
      const res = await request(app)
        .get('/api/data');

      expect(res.status).toBe(200);
      expect(res.body.evidence).toBeDefined();
      expect(Array.isArray(res.body.evidence)).toBe(true);
    });
  });
});