const request = require('supertest');
const app = require('../server');
const crypto = require('crypto');

describe('Users API', () => {
  let token = null;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@desicrew.in', password: 'password123' });
    token = res.body.token;
  });

  describe('GET /api/data', () => {
    it('should return all users', async () => {
      const res = await request(app)
        .get('/api/data');

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user', async () => {
      const newUser = {
        id: 'test-user-' + crypto.randomBytes(4).toString('hex'),
        name: 'Test User',
        email: 'testuser' + Date.now() + '@desicrew.in',
        role: 'Contributor',
        department: 'Operations',
        isActive: true,
        password: 'testpass123'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const newUser = {
        id: 'test-user-' + crypto.randomBytes(4).toString('hex'),
        name: 'Test User',
        email: 'admin@desicrew.in',
        role: 'Contributor',
        department: 'Operations',
        isActive: true,
        password: 'testpass123'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already exists');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUserId = null;

    beforeAll(async () => {
      testUserId = 'test-user-' + crypto.randomBytes(4).toString('hex');
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: testUserId,
          name: 'Test User',
          email: 'testuserput' + Date.now() + '@desicrew.in',
          role: 'Contributor',
          department: 'Operations',
          isActive: true,
          password: 'testpass123'
        });
    });

    it('should update user', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', department: 'IT' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update user password', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const deleteId = 'test-user-' + crypto.randomBytes(4).toString('hex');
      
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: deleteId,
          name: 'Delete Test',
          email: 'deletetest' + Date.now() + '@desicrew.in',
          role: 'Contributor',
          department: 'Operations',
          isActive: true,
          password: 'testpass123'
        });

      const res = await request(app)
        .delete(`/api/users/${deleteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});