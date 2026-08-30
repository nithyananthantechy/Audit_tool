const request = require('supertest');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = require('../server');

process.env.NODE_ENV = 'test';
process.env.PORT = 3002;

let authToken = null;
let testUser = null;

const api = {
  request: () => request(app),

  seedUser: async (email, password, role = 'Super Admin', department = 'Admin') => {
    const hashed = bcrypt.hashSync(password, 10);
    const user = {
      id: 'test_u_' + crypto.randomBytes(4).toString('hex'),
      name: 'Test Setup User',
      email: email,
      role: role,
      department: department,
      isActive: 1,
      password: hashed,
      isLocked: 0,
      loginAttempts: 0,
      mfaEnabled: 0
    };
    await app.db.prepare('INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, mfaEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      user.id, user.name, user.email, user.role, user.department, user.isActive, user.password, user.isLocked, user.loginAttempts, user.mfaEnabled
    );
    return user;
  },

  login: async (email, password) => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    if (res.body.token) {
      authToken = res.body.token;
      testUser = res.body.user;
    }
    return res;
  },

  logout: async () => {
    if (!authToken) return { status: 200 };
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);
    authToken = null;
    return res;
  },

  getToken: () => authToken,
  getUser: () => testUser,
  setToken: (token) => { authToken = token; }
};

module.exports = api;