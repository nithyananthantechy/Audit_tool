const request = require('supertest');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.PORT = 3002;

const app = require('../server');

let authToken = null;
let testUser = null;

const api = {
  request: () => request(app),
  
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