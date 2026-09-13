const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const config = require('../src/config/env');
const { authenticate } = require('../src/middleware/auth');

describe('Auth Middleware Security, Performance & Fast Rejection', () => {
  let testUser = null;
  let validToken = null;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }
    await User.deleteMany({ email: /authtest/ });

    testUser = await User.create({
      name: 'مستخدم اختبار المصادقة',
      email: 'authtest.researcher@example.com',
      passwordHash: 'hashed_password_123',
      role: 'user',
      status: 'active'
    });

    validToken = jwt.sign(
      { id: testUser._id.toString(), email: testUser.email, role: testUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  after(async () => {
    await User.deleteMany({ email: /authtest/ });
    await mongoose.disconnect();
  });

  const runMiddleware = (headers = {}, cookies = {}) => {
    return new Promise((resolve) => {
      const req = { headers, cookies };
      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          resolve({ status: this.statusCode, body: data, user: req.user });
        }
      };
      const next = () => {
        resolve({ status: 200, nextCalled: true, user: req.user });
      };

      authenticate(req, res, next).catch((err) => {
        resolve({ status: 500, error: err });
      });
    });
  };

  test('1. Valid local JWT passes and attaches req.user within milliseconds', async () => {
    const start = Date.now();
    const result = await runMiddleware({ authorization: `Bearer ${validToken}` });
    const elapsed = Date.now() - start;

    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.nextCalled, true);
    assert.ok(result.user);
    assert.strictEqual(result.user._id.toString(), testUser._id.toString());
    assert.ok(elapsed < 100, `Must be fast, took ${elapsed}ms`);
  });

  test('2. Missing or empty token is rejected immediately with 401 UNAUTHORIZED', async () => {
    const start = Date.now();
    const result = await runMiddleware({});
    const elapsed = Date.now() - start;

    assert.strictEqual(result.status, 401);
    assert.strictEqual(result.body.code, 'UNAUTHORIZED');
    assert.ok(elapsed < 50, `Must be immediate rejection, took ${elapsed}ms`);
  });

  test('3. Invalid token fails FAST (<50ms)', async () => {
    const fakeLocalToken = jwt.sign(
      { id: '65f01a1b2c3d4e5f6a7b8c9d', email: 'fake@example.com' },
      'wrong_secret_123',
      { expiresIn: '1h' }
    );

    const start = Date.now();
    const result = await runMiddleware({ authorization: `Bearer ${fakeLocalToken}` });
    const elapsed = Date.now() - start;

    assert.strictEqual(result.status, 401);
    assert.strictEqual(result.body.code, 'INVALID_TOKEN');
    assert.ok(elapsed < 50, `Must reject invalid token immediately, took ${elapsed}ms`);
  });

  test('4. Non-existent MongoDB user ID returns 401 USER_NOT_FOUND immediately', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const ghostToken = jwt.sign(
      { id: nonExistentId.toString(), email: 'ghost@example.com', role: 'user' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const start = Date.now();
    const result = await runMiddleware({ authorization: `Bearer ${ghostToken}` });
    const elapsed = Date.now() - start;

    assert.strictEqual(result.status, 401);
    assert.strictEqual(result.body.code, 'USER_NOT_FOUND');
    assert.ok(elapsed < 50, `Must return user not found fast, took ${elapsed}ms`);
  });
});
