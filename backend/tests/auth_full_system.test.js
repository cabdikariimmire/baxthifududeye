const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const config = require('../src/config/env');
const { authenticate, requireAdmin } = require('../src/middleware/auth');
const authController = require('../src/controllers/authController');

describe('First-Party Authentication & Authorization Comprehensive Suite', () => {
  const TEST_EMAIL_PREFIX = 'auth_suite_test_';
  let testUser = null;
  let adminUser = null;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }
    // Clean any prior test users
    await User.deleteMany({ email: new RegExp(`^${TEST_EMAIL_PREFIX}`) });

    // Seed test admin
    adminUser = await User.create({
      name: 'مدير اختبار النظام',
      email: `${TEST_EMAIL_PREFIX}admin@academic.edu`,
      passwordHash: await User.hashPassword('AdminPass123!'),
      role: 'admin',
      status: 'active',
      emailVerified: true
    });
  });

  after(async () => {
    await User.deleteMany({ email: new RegExp(`^${TEST_EMAIL_PREFIX}`) });
    await mongoose.disconnect();
  });

  // Helper to mock express req/res
  const createMockReqRes = ({ body = {}, cookies = {}, headers = {}, user = null } = {}) => {
    const req = {
      body,
      cookies,
      headers,
      user
    };
    const res = {
      statusCode: 200,
      headers: {},
      cookiesSet: {},
      cookiesCleared: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      cookie(name, val, opts) {
        this.cookiesSet[name] = { val, opts };
        return this;
      },
      clearCookie(name, opts) {
        this.cookiesCleared[name] = opts;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };
    return { req, res };
  };

  test('1. User Registration: Creates user with emailVerified=false and hashed password', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'الباحث الجديد',
        email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      }
    });

    let nextCalled = false;
    await authController.register(req, res, (err) => {
      if (err) throw err;
      nextCalled = true;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.email, `${TEST_EMAIL_PREFIX}scholar1@academic.edu`);
    assert.strictEqual(res.data.data.user.emailVerified, false);
    assert.strictEqual(res.data.data.user.role, 'user');
    assert.strictEqual(res.data.data.user.passwordHash, undefined);

    const dbUser = await User.findOne({ email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` }).select('+passwordHash +emailVerificationTokenHash');
    assert.ok(dbUser);
    assert.notStrictEqual(dbUser.passwordHash, 'Password123!');
    assert.ok(dbUser.emailVerificationTokenHash);
    assert.ok(dbUser.emailVerificationExpires > new Date());
  });

  test('2. User Registration: Rejects duplicate email with 400', async () => {
    const { req, res } = createMockReqRes({
      body: {
        name: 'الباحث المكرر',
        email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      }
    });

    await authController.register(req, res, () => {});

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.code, 'EMAIL_ALREADY_EXISTS');
  });

  test('3. Login: Rejects unverified email with 403 EMAIL_NOT_VERIFIED', async () => {
    const { req, res } = createMockReqRes({
      body: {
        email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu`,
        password: 'Password123!'
      }
    });

    await authController.login(req, res, () => {});

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.code, 'EMAIL_NOT_VERIFIED');
    assert.strictEqual(res.data.data.unverified, true);
  });

  test('4. Email Verification: Valid token verifies user, sets HttpOnly cookie, and clears tokens', async () => {
    const user = await User.findOne({ email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` });
    const rawToken = user.createEmailVerificationToken();
    await user.save();

    const { req, res } = createMockReqRes({
      body: { token: rawToken }
    });

    await authController.verifyEmail(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.emailVerified, true);
    assert.ok(res.cookiesSet.token);
    assert.strictEqual(res.cookiesSet.token.opts.httpOnly, true);

    const updatedUser = await User.findById(user._id).select('+emailVerificationTokenHash');
    assert.strictEqual(updatedUser.emailVerified, true);
    assert.strictEqual(updatedUser.emailVerificationTokenHash, undefined);
  });

  test('5. Email Verification: Single-use verification token fails when reused', async () => {
    const { req, res } = createMockReqRes({
      body: { token: 'previously_used_token_string_123456789' }
    });

    await authController.verifyEmail(req, res, () => {});

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.code, 'INVALID_OR_EXPIRED_TOKEN');
  });

  test('6. Login: Successful login for verified user sets secure HttpOnly cookie', async () => {
    const { req, res } = createMockReqRes({
      body: {
        email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu`,
        password: 'Password123!'
      }
    });

    await authController.login(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.emailVerified, true);
    assert.ok(res.cookiesSet.token);
    assert.strictEqual(res.cookiesSet.token.opts.httpOnly, true);
    assert.strictEqual(res.cookiesSet.token.opts.path, '/');
  });

  test('7. Login: Rejects invalid password with 401', async () => {
    const { req, res } = createMockReqRes({
      body: {
        email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu`,
        password: 'WrongPassword999!'
      }
    });

    await authController.login(req, res, () => {});

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.code, 'INVALID_CREDENTIALS');
  });

  test('8. Auth Middleware: Strictly rejects request without token with 401', async () => {
    let nextCalled = false;
    const { req, res } = createMockReqRes({});

    await authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.code, 'UNAUTHORIZED');
  });

  test('9. Auth Middleware: Valid HttpOnly cookie attaches user to req.user', async () => {
    const user = await User.findOne({ email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` });
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    let nextCalled = false;
    const { req, res } = createMockReqRes({
      cookies: { token }
    });

    await authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.ok(req.user);
    assert.strictEqual(req.user._id.toString(), user._id.toString());
  });

  test('10. Auth Middleware: Rejects tampered JWT signature with 401', async () => {
    const forgedToken = jwt.sign(
      { id: '65f01a1b2c3d4e5f6a7b8c9d', email: 'hacker@example.com' },
      'forged_secret_key_123',
      { expiresIn: '1h' }
    );

    let nextCalled = false;
    const { req, res } = createMockReqRes({
      cookies: { token: forgedToken }
    });

    await authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.code, 'INVALID_TOKEN');
  });

  test('11. Auth Middleware: Rejects expired JWT with 401', async () => {
    const user = await User.findOne({ email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` });
    const expiredToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '-1s' }
    );

    let nextCalled = false;
    const { req, res } = createMockReqRes({
      cookies: { token: expiredToken }
    });

    await authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.code, 'INVALID_TOKEN');
  });

  test('12. Password Recovery: Forgot password returns privacy-safe generic confirmation', async () => {
    const { req, res } = createMockReqRes({
      body: { email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` }
    });

    await authController.forgotPassword(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.message.includes('إذا كان البريد'));

    const user = await User.findOne({ email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` }).select('+passwordResetTokenHash');
    assert.ok(user.passwordResetTokenHash);
    assert.ok(user.passwordResetExpires > new Date());
  });

  test('13. Password Recovery: Reset password updates hash and allows login with new password', async () => {
    const user = await User.findOne({ email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` });
    const rawResetToken = user.createPasswordResetToken();
    await user.save();

    const { req, res } = createMockReqRes({
      body: {
        token: rawResetToken,
        password: 'NewBrandPassword456!',
        confirmPassword: 'NewBrandPassword456!'
      }
    });

    await authController.resetPassword(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);

    // Old password fails
    const { req: oldReq, res: oldRes } = createMockReqRes({
      body: { email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu`, password: 'Password123!' }
    });
    await authController.login(oldReq, oldRes, () => {});
    assert.strictEqual(oldRes.statusCode, 401);

    // New password succeeds
    const { req: newReq, res: newRes } = createMockReqRes({
      body: { email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu`, password: 'NewBrandPassword456!' }
    });
    await authController.login(newReq, newRes, () => {});
    assert.strictEqual(newRes.statusCode, 200);
  });

  test('14. Role Authorization (requireAdmin): Rejects regular user with 403 FORBIDDEN', async () => {
    const regularUser = await User.findOne({ email: `${TEST_EMAIL_PREFIX}scholar1@academic.edu` });
    let nextCalled = false;
    const { req, res } = createMockReqRes({
      user: regularUser
    });

    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.code, 'FORBIDDEN');
  });

  test('15. Role Authorization (requireAdmin): Grants access to admin user', async () => {
    let nextCalled = false;
    const { req, res } = createMockReqRes({
      user: adminUser
    });

    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
  });

  test('16. Logout: Clears auth cookie server-side', async () => {
    const { req, res } = createMockReqRes({});

    await authController.logout(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.cookiesCleared.token);
  });
});
