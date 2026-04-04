const request = require('supertest');
const app = require('../server');
const crypto = require('crypto');

describe('Notifications API', () => {
  let token = null;
  let userId = null;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@desicrew.in', password: 'password123' });
    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('GET /api/notifications', () => {
    it('should return notifications for logged-in user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications).toBeDefined();
      expect(res.body.unreadCount).toBeDefined();
      expect(typeof res.body.unreadCount).toBe('number');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notifyId = 'test-not-' + crypto.randomBytes(4).toString('hex');
      
      await new Promise((resolve, reject) => {
        const db = require('better-sqlite3')(require('path').join(__dirname, '../audit.db'));
        db.prepare(`INSERT OR IGNORE INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)`)
          .run(notifyId, userId, 'info', 'Test Notification', 'Test message', new Date().toISOString());
        db.close();
        resolve();
      });

      const res = await request(app)
        .put(`/api/notifications/${notifyId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('should return notification preferences', async () => {
      const res = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBeDefined();
      expect(res.body.inApp).toBeDefined();
      expect(res.body.email).toBeDefined();
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const res = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inApp: true,
          email: false,
          submission: true,
          approval: true,
          deadline: true,
          assignment: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});