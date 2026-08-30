const request = require('supertest');
const app = require('../server');
const api = require('./setup');

describe('Evidence API', () => {
  let token = null;
  let evidenceId = null;
  const userEmail = `ev_user_${Date.now()}@nitechspark.in`;
  const userPass = 'EvSecure#2026!';

  beforeAll(async () => {
    await api.seedUser(userEmail, userPass, 'Super Admin', 'Audit');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPass });
    token = res.body.token;
  });

  it('should submit evidence and return id', async () => {
    const res = await request(app)
      .post('/api/evidence')
      .set('Authorization', `Bearer ${token}`)
      .send({
        checklistId: 'it2',
        comment: 'Access review completed for quarter',
        department: 'IT',
        fileName: 'access_matrix.xlsx'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
    evidenceId = res.body.id;
  });

  it('should update evidence status with auditor authorization', async () => {
    const res = await request(app)
      .put(`/api/evidence/${evidenceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'Auditor Approved',
        managerComment: 'Verified against SOC 2 CC6.2'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});