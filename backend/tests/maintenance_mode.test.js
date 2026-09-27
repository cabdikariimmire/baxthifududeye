const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('../src/config/env');
const User = require('../src/models/User');
const SiteSettings = require('../src/models/SiteSettings');
const app = require('../src/app');

// Supertest-free native node fetch / http test runner against app
const http = require('http');

describe('Server-Side Maintenance Mode Acceptance Tests', () => {
  let server;
  let baseUrl;
  let adminUser;
  let normalUser;
  let adminToken;
  let normalToken;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/ai_research_assistant');
    }

    // Start ephemeral HTTP server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Create test admin and normal users
    await User.deleteMany({ email: { $in: ['maint-admin@test.com', 'maint-normal@test.com'] } });
    adminUser = await User.create({
      name: 'مسؤول الصيانة التجريبي',
      email: 'maint-admin@test.com',
      passwordHash: 'dummyhash',
      role: 'super_admin',
      status: 'active'
    });
    normalUser = await User.create({
      name: 'مستخدم عادي تجريبي',
      email: 'maint-normal@test.com',
      passwordHash: 'dummyhash',
      role: 'user',
      status: 'active'
    });

    adminToken = jwt.sign({ id: adminUser._id, email: adminUser.email, role: adminUser.role }, config.jwtSecret);
    normalToken = jwt.sign({ id: normalUser._id, email: normalUser.email, role: normalUser.role }, config.jwtSecret);

    // Ensure maintenance mode is off initially
    await SiteSettings.findOneAndUpdate({}, {
      'system.maintenanceMode': false
    }, { upsert: true, new: true });
  });

  after(async () => {
    // Reset maintenance mode to false
    await SiteSettings.findOneAndUpdate({}, {
      'system.maintenanceMode': false
    });
    await User.deleteMany({ email: { $in: ['maint-admin@test.com', 'maint-normal@test.com'] } });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  it('1. Public settings endpoint reports maintenance state accurately', async () => {
    const res = await fetch(`${baseUrl}/api/public/settings`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.system.maintenanceMode, false);
  });

  it('2. Authorized admin can toggle Maintenance Mode ON via POST /api/admin/settings/maintenance', async () => {
    const res = await fetch(`${baseUrl}/api/admin/settings/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        enabled: true,
        title: 'الموقع قيد الصيانة المجدولة',
        message: 'نقوم بتحديثات برمجية مهمة'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.maintenanceMode, true);

    // Verify DB persistence
    const settings = await SiteSettings.findOne();
    assert.equal(settings.system.maintenanceMode, true);
    assert.equal(settings.system.maintenanceTitle, 'الموقع قيد الصيانة المجدولة');
  });

  it('3. When Maintenance Mode is ON, normal users are blocked with HTTP 503', async () => {
    const res = await fetch(`${baseUrl}/api/researches`, {
      headers: {
        Authorization: `Bearer ${normalToken}`
      }
    });

    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'MAINTENANCE_MODE');
    assert.equal(body.data.maintenanceMode, true);
    assert.equal(body.data.title, 'الموقع قيد الصيانة المجدولة');
  });

  it('4. When Maintenance Mode is ON, public unauthenticated requests are blocked with HTTP 503', async () => {
    const res = await fetch(`${baseUrl}/api/researches/some-fake-id`);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.code, 'MAINTENANCE_MODE');
  });

  it('5. When Maintenance Mode is ON, auth endpoints & public settings remain accessible', async () => {
    const resSettings = await fetch(`${baseUrl}/api/public/settings`);
    assert.equal(resSettings.status, 200);
    const body = await resSettings.json();
    assert.equal(body.data.system.maintenanceMode, true);

    const resHealth = await fetch(`${baseUrl}/api/health`);
    assert.equal(resHealth.status, 200);
  });

  it('6. When Maintenance Mode is ON, authorized administrators can still access Admin Dashboard', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.stats);
  });

  it('7. Admin can toggle Maintenance Mode back OFF and normal users regain access', async () => {
    const resToggle = await fetch(`${baseUrl}/api/admin/settings/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ enabled: false })
    });
    assert.equal(resToggle.status, 200);

    // Normal user now gets 200 OK
    const res = await fetch(`${baseUrl}/api/researches`, {
      headers: {
        Authorization: `Bearer ${normalToken}`
      }
    });
    assert.equal(res.status, 200);
  });
});
