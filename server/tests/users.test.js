const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const api = require('./setup');

describe('Users API', () => {
  let token = null;
  const adminEmail = `admin_users_${Date.now()}@nitechspark.in`;
  const adminPass = 'SecureAdmin#2026!';

  beforeAll(async () => {
    await api.seedUser(adminEmail, adminPass, 'Super Admin', 'Admin');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPass });
    token = res.body.token;
  });

  describe('GET /api/data', () => {
    it('should return compliance dataset including users', async () => {
      const res = await request(app)
        .get('/api/data')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user with Super Admin auth', async () => {
      const newUser = {
        name: 'Test Operational User',
        email: `opuser_${Date.now()}@nitechspark.in`,
        role: 'Contributor',
        department: 'Operations',
        password: 'ValidSecurePassword#2026'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email.toLowerCase()).toBe(newUser.email.toLowerCase());
    });
  });
});