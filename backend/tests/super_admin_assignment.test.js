const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('../src/config/env');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  isDesignatedSuperAdmin,
  getOrCreateMongoUserForClerk,
  DESIGNATED_SUPER_ADMIN_EMAIL
} = require('../src/middleware/auth');
const adminController = require('../src/controllers/adminController');

describe('Super Admin Assignment and Authorization Acceptance Tests', () => {
  let superAdminUser;
  let regularAdminUser;
  let normalUser;
  let testCandidateUser;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/ai_research_assistant');
    }

    // Verify or find the designated Super Admin
    await User.updateOne({ email: 'abdikrimmireahmd@gmail.com' }, { role: 'super_admin' });
    superAdminUser = await User.findOne({ email: 'abdikrimmireahmd@gmail.com' });
    assert.ok(superAdminUser, 'User abdikrimmireahmd@gmail.com must exist in the database');


    // Clean up temporary test users if any exist
    await User.deleteMany({
      email: {
        $in: [
          'test-regular-admin@testing.com',
          'test-normal-user@testing.com',
          'test-candidate-user@testing.com'
        ]
      }
    });

    // Create a regular admin for comparison
    regularAdminUser = await User.create({
      name: 'Regular Admin Test',
      email: 'test-regular-admin@testing.com',
      passwordHash: 'testhash',
      role: 'admin',
      status: 'active',
      emailVerified: true
    });

    // Create a normal user
    normalUser = await User.create({
      name: 'Normal User Test',
      email: 'test-normal-user@testing.com',
      passwordHash: 'testhash',
      role: 'user',
      status: 'active',
      emailVerified: true
    });

    // Create a candidate user to test role promotion
    testCandidateUser = await User.create({
      name: 'Candidate User Test',
      email: 'test-candidate-user@testing.com',
      passwordHash: 'testhash',
      role: 'user',
      status: 'active',
      emailVerified: true
    });
  });

  after(async () => {
    await User.deleteMany({
      email: {
        $in: [
          'test-regular-admin@testing.com',
          'test-normal-user@testing.com',
          'test-candidate-user@testing.com'
        ]
      }
    });
    await mongoose.disconnect();
  });


  it('1. Designated email is recognized by server-side helper and constants', () => {
    assert.strictEqual(DESIGNATED_SUPER_ADMIN_EMAIL, 'abdikrimmireahmd@gmail.com');
    assert.strictEqual(isDesignatedSuperAdmin('abdikrimmireahmd@gmail.com'), true);
    assert.strictEqual(isDesignatedSuperAdmin('ABDIKRIMMIREAHMD@GMAIL.COM'), true);
    assert.strictEqual(isDesignatedSuperAdmin('normal-user@gmail.com'), false);
    assert.strictEqual(isDesignatedSuperAdmin(null), false);
    assert.strictEqual(isDesignatedSuperAdmin(''), false);
  });

  it('2. The existing database record for abdikrimmireahmd@gmail.com has role = super_admin', async () => {
    const user = await User.findOne({ email: 'abdikrimmireahmd@gmail.com' });
    assert.ok(user, 'User record must exist');
    assert.strictEqual(user.role, 'super_admin');
    assert.strictEqual(user.status, 'active');
  });

  it('3. Existing research data for abdikrimmireahmd@gmail.com is fully intact and preserved', async () => {
    const user = await User.findOne({ email: 'abdikrimmireahmd@gmail.com' });
    const count = await Research.countDocuments({ userId: user._id });
    assert.ok(count > 0, `Expected existing research documents to be preserved, found ${count}`);
  });

  it('4. getOrCreateMongoUserForClerk ensures abdikrimmireahmd@gmail.com is super_admin and does not duplicate', async () => {
    const existingUser = await User.findOne({ email: 'abdikrimmireahmd@gmail.com' });
    const clerkId = existingUser.clerkId || 'user_3Ir7brn8bpSsV8Jdh0INy4zheYp';

    const syncedUser = await getOrCreateMongoUserForClerk(clerkId);
    assert.ok(syncedUser);
    assert.strictEqual(syncedUser._id.toString(), existingUser._id.toString(), 'Must preserve original user _id');
    assert.strictEqual(syncedUser.email, 'abdikrimmireahmd@gmail.com');
    assert.strictEqual(syncedUser.role, 'super_admin');

    const totalCount = await User.countDocuments({ email: 'abdikrimmireahmd@gmail.com' });
    assert.strictEqual(totalCount, 1, 'No duplicate user documents should exist');
  });

  it('5. Server-side authenticate middleware attaches role = super_admin for abdikrimmireahmd@gmail.com', async () => {
    const user = await User.findOne({ email: 'abdikrimmireahmd@gmail.com' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, config.jwtSecret);

    let nextCalled = false;
    const req = {
      cookies: { token },
      headers: {}
    };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      }
    };

    await authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.ok(req.user);
    assert.strictEqual(req.user.email, 'abdikrimmireahmd@gmail.com');
    assert.strictEqual(req.user.role, 'super_admin');
  });

  it('6. requireAdmin allows super_admin and admin, but strictly rejects normal users with 403', () => {
    let superAdminAllowed = false;
    requireAdmin({ user: { role: 'super_admin' } }, {}, () => {
      superAdminAllowed = true;
    });
    assert.strictEqual(superAdminAllowed, true, 'Super admin must pass requireAdmin');

    let adminAllowed = false;
    requireAdmin({ user: { role: 'admin' } }, {}, () => {
      adminAllowed = true;
    });
    assert.strictEqual(adminAllowed, true, 'Admin must pass requireAdmin');

    let forbiddenCode = null;
    let forbiddenBody = null;
    requireAdmin(
      { user: { role: 'user' } },
      {
        status(code) {
          forbiddenCode = code;
          return this;
        },
        json(body) {
          forbiddenBody = body;
          return this;
        }
      },
      () => {
        assert.fail('Normal user must not pass requireAdmin');
      }
    );
    assert.strictEqual(forbiddenCode, 403);
    assert.strictEqual(forbiddenBody.code, 'FORBIDDEN');
  });

  it('7. requireSuperAdmin strictly allows ONLY super_admin (rejects admin and normal user with 403)', () => {
    let superAdminAllowed = false;
    requireSuperAdmin({ user: { role: 'super_admin' } }, {}, () => {
      superAdminAllowed = true;
    });
    assert.strictEqual(superAdminAllowed, true, 'Super Admin must pass requireSuperAdmin');

    let adminForbidden = false;
    requireSuperAdmin(
      { user: { role: 'admin' } },
      {
        status(code) {
          if (code === 403) adminForbidden = true;
          return this;
        },
        json() {
          return this;
        }
      },
      () => {
        assert.fail('Admin must not pass requireSuperAdmin');
      }
    );
    assert.strictEqual(adminForbidden, true, 'Admin must receive 403 on requireSuperAdmin');

    let userForbidden = false;
    requireSuperAdmin(
      { user: { role: 'user' } },
      {
        status(code) {
          if (code === 403) userForbidden = true;
          return this;
        },
        json() {
          return this;
        }
      },
      () => {
        assert.fail('Normal user must not pass requireSuperAdmin');
      }
    );
    assert.strictEqual(userForbidden, true, 'Normal user must receive 403 on requireSuperAdmin');
  });

  it('8. Super Admin can manage roles: promote normal user to admin', async () => {
    const req = {
      params: { id: testCandidateUser._id.toString() },
      body: { role: 'admin' },
      user: superAdminUser
    };
    let responseBody = null;
    const res = {
      json(body) {
        responseBody = body;
        return this;
      },
      status() {
        return this;
      }
    };

    await adminController.updateUserRole(req, res, (err) => {
      if (err) throw err;
    });

    assert.ok(responseBody.success);
    assert.strictEqual(responseBody.data.user.role, 'admin');

    const updated = await User.findById(testCandidateUser._id);
    assert.strictEqual(updated.role, 'admin');
  });

  it('9. Regular Admin CANNOT promote anyone to super_admin (403 Forbidden)', async () => {
    const req = {
      params: { id: testCandidateUser._id.toString() },
      body: { role: 'super_admin' },
      user: regularAdminUser
    };
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      }
    };

    await adminController.updateUserRole(req, res, () => {});
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(responseBody.code, 'FORBIDDEN');
  });

  it('10. A user CANNOT modify their own role via client request', async () => {
    const req = {
      params: { id: superAdminUser._id.toString() },
      body: { role: 'admin' },
      user: superAdminUser
    };
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      }
    };

    await adminController.updateUserRole(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.code, 'CANNOT_MODIFY_OWN_ROLE');
  });

  it('11. The designated Super Admin account CANNOT be demoted', async () => {
    // Another super admin (if any) attempts to demote the designated super admin
    const fakeOtherSuperAdmin = { _id: new mongoose.Types.ObjectId(), role: 'super_admin' };
    const req = {
      params: { id: superAdminUser._id.toString() },
      body: { role: 'user' },
      user: fakeOtherSuperAdmin
    };
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      }
    };

    await adminController.updateUserRole(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.code, 'CANNOT_DEMOTE_DESIGNATED_SUPER_ADMIN');
  });

  it('12. Normal user registration does NOT accept or trust role from request body', async () => {
    const authController = require('../src/controllers/authController');
    const spoofedEmail = 'spoofed-role-attempt@testing.com';
    await User.deleteMany({ email: spoofedEmail });

    const req = {
      body: {
        name: 'Spoof Attempt',
        email: spoofedEmail,
        password: 'Password123!',
        role: 'super_admin' // Spoofed role sent by client
      }
    };

    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      }
    };

    await authController.register(req, res, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(statusCode, 201);
    const createdUser = await User.findOne({ email: spoofedEmail });
    assert.strictEqual(createdUser.role, 'user', 'Client cannot self-assign super_admin role');

    // Clean up
    await User.deleteMany({ email: spoofedEmail });
  });
});
