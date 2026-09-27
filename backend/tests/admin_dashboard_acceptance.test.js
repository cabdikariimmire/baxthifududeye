const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('../src/config/env');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const ActivityLog = require('../src/models/ActivityLog');
const adminController = require('../src/controllers/adminController');

describe('Admin Dashboard Security and Acceptance Tests', () => {
  let adminUser;
  let normalUser;
  let adminToken;
  let normalToken;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/ai_research_assistant');
    }

    // Clean up test fixtures if present
    await User.deleteMany({ email: { $in: ['admin-test@acceptance.com', 'normal-test@acceptance.com', 'user2-test@acceptance.com'] } });

    // Create a real admin user
    adminUser = await User.create({
      name: 'مدير النظام التجريبي',
      email: 'admin-test@acceptance.com',
      passwordHash: 'dummyhash',
      role: 'admin',
      status: 'active'
    });

    // Create a normal user
    normalUser = await User.create({
      name: 'مستخدم عادي تجريبي',
      email: 'normal-test@acceptance.com',
      passwordHash: 'dummyhash',
      role: 'user',
      status: 'active'
    });

    adminToken = jwt.sign({ id: adminUser._id, email: adminUser.email, role: adminUser.role }, config.jwtSecret);
    normalToken = jwt.sign({ id: normalUser._id, email: normalUser.email, role: normalUser.role }, config.jwtSecret);
  });

  after(async () => {
    await User.deleteMany({ email: { $in: ['admin-test@acceptance.com', 'normal-test@acceptance.com', 'user2-test@acceptance.com'] } });
    await ActivityLog.deleteMany({ userEmail: { $in: ['admin-test@acceptance.com', 'normal-test@acceptance.com'] } });
    await mongoose.disconnect();
  });

  it('1. requireAdmin middleware strictly blocks normal users with 403 Forbidden', async () => {
    const { requireAdmin } = require('../src/middleware/auth');

    let responseCode = null;
    let responseBody = null;

    const req = {
      user: normalUser
    };
    const res = {
      status(code) {
        responseCode = code;
        return {
          json(body) {
            responseBody = body;
          }
        };
      }
    };

    let nextCalled = false;
    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'next() must NOT be called for normal user');
    assert.equal(responseCode, 403, 'Must return 403 Forbidden');
    assert.equal(responseBody.code, 'FORBIDDEN');
    assert.ok(responseBody.message.includes('غير مصرح'), 'Arabic error message expected');
  });

  it('2. requireAdmin middleware allows admin users through', async () => {
    const { requireAdmin } = require('../src/middleware/auth');

    const req = {
      user: adminUser
    };
    const res = {};

    let nextCalled = false;
    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'next() MUST be called for admin user');
  });

  it('3. getStats calculates real MongoDB numbers without mock data', async () => {
    let result = null;
    const req = { user: adminUser };
    const res = {
      json(payload) {
        result = payload;
      }
    };

    await adminController.getStats(req, res, (err) => {
      if (err) throw err;
    });

    assert.ok(result && result.success, 'Response must be success');
    const { stats, recentResearches } = result.data;

    assert.equal(typeof stats.userCount, 'number', 'userCount must be a number');
    assert.equal(typeof stats.researchCount, 'number', 'researchCount must be a number');
    assert.equal(typeof stats.completedResearchCount, 'number', 'completedResearchCount must be a number');
    assert.ok(Array.isArray(recentResearches), 'recentResearches must be an array');
    assert.ok(stats.userCount >= 2, 'userCount must reflect the created test users');
  });

  it('4. listUsers returns paginated real users and counts', async () => {
    let result = null;
    const req = {
      user: adminUser,
      query: { page: '1', limit: '10', q: 'admin-test' }
    };
    const res = {
      json(payload) {
        result = payload;
      }
    };

    await adminController.listUsers(req, res, (err) => {
      if (err) throw err;
    });

    assert.ok(result && result.success);
    assert.equal(result.data.users.length, 1);
    assert.equal(result.data.users[0].email, 'admin-test@acceptance.com');
    assert.equal(result.data.users[0].passwordHash, undefined, 'passwordHash must never be exposed');
    assert.equal(typeof result.data.users[0].researchCount, 'number', 'researchCount must be computed');
  });

  it('5. updateUserRole strictly prevents removing the last active administrator', async () => {
    // If only one admin exists in database, demoting them must fail
    const realSuperAdmin = await User.findOne({ email: 'abdikrimmireahmd@gmail.com' });
    await User.updateMany({ _id: { $ne: adminUser._id }, role: { $in: ['admin', 'super_admin'] } }, { role: 'user' });

    let statusCode = null;
    let responseBody = null;

    const req = {
      user: adminUser,
      params: { id: String(adminUser._id) },
      body: { role: 'user' }
    };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            responseBody = body;
          }
        };
      },
      json(body) {
        responseBody = body;
      }
    };

    await adminController.updateUserRole(req, res, (err) => {
      if (err) throw err;
    });

    // Restore real super admin immediately
    if (realSuperAdmin) {
      await User.updateOne({ _id: realSuperAdmin._id }, { role: 'super_admin' });
    }

    assert.equal(statusCode, 400, 'Must reject demoting last admin with 400 Bad Request');
    assert.equal(responseBody.code, 'CANNOT_REMOVE_LAST_ADMIN');

    // Verify role in database remained 'admin'
    const checkUser = await User.findById(adminUser._id);
    assert.equal(checkUser.role, 'admin');
  });


  it('6. updateUserRole successfully updates role when multiple admins exist', async () => {
    // Create a second admin
    const secondAdmin = await User.create({
      name: 'مدير ثانٍ',
      email: 'user2-test@acceptance.com',
      passwordHash: 'dummy',
      role: 'admin',
      status: 'active'
    });

    let result = null;
    const req = {
      user: adminUser,
      params: { id: String(secondAdmin._id) },
      body: { role: 'user' }
    };
    const res = {
      json(payload) {
        result = payload;
      }
    };

    await adminController.updateUserRole(req, res, (err) => {
      if (err) throw err;
    });

    assert.ok(result && result.success);
    assert.equal(result.data.user.role, 'user');

    // Verify ActivityLog was recorded
    const log = await ActivityLog.findOne({ action: 'role_changed', targetId: String(secondAdmin._id) });
    assert.ok(log, 'ActivityLog for role_changed must be recorded');
  });

  it('7. getSystemSettings never exposes plaintext API keys', async () => {
    let result = null;
    const req = { user: adminUser };
    const res = {
      json(payload) {
        result = payload;
      }
    };

    await adminController.getSystemSettings(req, res, (err) => {
      if (err) throw err;
    });

    assert.ok(result && result.success);
    const { aiSettings, systemInfo } = result.data;
    assert.ok(aiSettings);
    assert.ok(!aiSettings.customApiKey || aiSettings.customApiKey.includes('••••'), 'API key must be masked');
    assert.ok(systemInfo.nodeVersion);
    assert.equal(systemInfo.databaseStatus, 'متصل (MongoDB)');
  });
});
