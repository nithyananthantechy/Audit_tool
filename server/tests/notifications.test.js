const request = require('supertest');
const app = require('../server');
const api = require('./setup');

describe('Notifications API', () => {
  let token = null;
  const userEmail = `notif_user_${Date.now()}@nitechspark.in`;
  const userPass = 'Notif#2026!';

  beforeAll(async () => {
    await api.seedUser(userEmail, userPass, 'Contributor', 'Operations');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: userPass });
    token = res.body.token;
  });

  it('GET /api/notifications should return notification list and unread count', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(typeof res.body.unreadCount).toBe('number');
  });

  it('PUT /api/notifications/read-all should mark notifications as read', async () => {
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});