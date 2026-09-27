const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');

const User = require('../src/models/User');
const Research = require('../src/models/Research');
const CMSContent = require('../src/models/CMSContent');
const SiteSettings = require('../src/models/SiteSettings');
const Media = require('../src/models/Media');
const ActivityLog = require('../src/models/ActivityLog');
const { seedDefaultCMSIfEmpty } = require('../src/controllers/cmsController');

// Helper to make fast HTTP requests to Express app without external network
function makeRequest(app, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const reqOptions = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(reqOptions, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          server.close();
          let json = null;
          try {
            json = JSON.parse(rawData);
          } catch (_) {
            json = rawData;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  });
}

test('=== Super Admin & CMS End-to-End Test Suite ===', async (t) => {
  let mongod;
  let normalUser;
  let superAdminUser;
  let normalUserToken;
  let superAdminToken;

  t.before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await seedDefaultCMSIfEmpty();

    // Create Normal User
    normalUser = await User.create({
      name: 'طالب جامعي',
      email: 'student@example.com',
      role: 'user',
      status: 'active',
      emailVerified: true
    });
    normalUserToken = jwt.sign({ id: normalUser._id }, config.jwtSecret, { expiresIn: '1d' });

    // Create Super Admin User
    superAdminUser = await User.create({
      name: 'المدير العام',
      email: 'superadmin@example.com',
      role: 'super_admin',
      status: 'active',
      emailVerified: true
    });
    superAdminToken = jwt.sign({ id: superAdminUser._id }, config.jwtSecret, { expiresIn: '1d' });
  });

  t.after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  await t.test('1. Security: Unauthenticated request to /api/admin/dashboard returns 401', async () => {
    const res = await makeRequest(app, { method: 'GET', path: '/api/admin/dashboard' });
    assert.strictEqual(res.status, 401, 'Unauthenticated request must receive 401');
    assert.strictEqual(res.body.success, false);
  });

  await t.test('2. Security: Normal user (role: user) request to /api/admin/dashboard returns 403 Forbidden', async () => {
    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/admin/dashboard',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    assert.strictEqual(res.status, 403, 'Normal user must receive 403 Forbidden on admin APIs');
    assert.strictEqual(res.body.success, false);
  });

  await t.test('3. Security: Super Admin (role: super_admin) accesses /api/admin/dashboard successfully', async () => {
    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/admin/dashboard',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.stats, 'Dashboard statistics must be returned');
  });

  await t.test('4. CMS: Admin gets and updates homepage content as draft', async () => {
    const getRes = await makeRequest(app, {
      method: 'GET',
      path: '/api/admin/content/home',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(getRes.status, 200);
    assert.ok(getRes.body.data.content);

    const updatedContent = {
      ...getRes.body.data.content,
      hero: {
        ...getRes.body.data.content.hero,
        title: 'عنوان البحث التجريبي المحدث'
      }
    };

    // Save as draft (publishNow: false)
    const draftRes = await makeRequest(app, {
      method: 'PUT',
      path: '/api/admin/content/home',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { content: updatedContent, publishNow: false }
    });
    assert.strictEqual(draftRes.status, 200);
    assert.strictEqual(draftRes.body.data.hasDraft, true);

    // Public endpoint MUST still return the published content, NOT the draft
    const publicRes = await makeRequest(app, { method: 'GET', path: '/api/public/cms/home' });
    assert.strictEqual(publicRes.status, 200);
    assert.notStrictEqual(
      publicRes.body.data.content.hero.title,
      'عنوان البحث التجريبي المحدث',
      'Draft content must NEVER be exposed publicly'
    );
  });

  await t.test('5. CMS: Publishing draft updates public website content', async () => {
    const publishRes = await makeRequest(app, {
      method: 'POST',
      path: '/api/admin/content/home/publish',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(publishRes.status, 200);
    assert.strictEqual(publishRes.body.data.status, 'published');

    // Public endpoint NOW returns the published changes
    const publicRes = await makeRequest(app, { method: 'GET', path: '/api/public/cms/home' });
    assert.strictEqual(publicRes.status, 200);
    assert.strictEqual(
      publicRes.body.data.content.hero.title,
      'عنوان البحث التجريبي المحدث',
      'Public endpoint must return updated published content'
    );
  });

  await t.test('6. CMS: Site Settings & Branding CRUD', async () => {
    const updateRes = await makeRequest(app, {
      method: 'PUT',
      path: '/api/admin/settings',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        websiteName: 'مساعد البحث الأكاديمي المطور',
        brand: { primaryColor: '#0F8F83', secondaryColor: '#0F2747' }
      }
    });
    assert.strictEqual(updateRes.status, 200);

    const publicSettings = await makeRequest(app, { method: 'GET', path: '/api/public/settings' });
    assert.strictEqual(publicSettings.status, 200);
    assert.strictEqual(publicSettings.body.data.websiteName, 'مساعد البحث الأكاديمي المطور');
  });

  await t.test('7. CMS: SEO settings management', async () => {
    const seoRes = await makeRequest(app, {
      method: 'PUT',
      path: '/api/admin/seo',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        seo: {
          siteTitle: 'بوابة البحث العلمي الحديث',
          metaDescription: 'أحدث منصة ذكية لبناء الأبحاث'
        }
      }
    });
    assert.strictEqual(seoRes.status, 200);
  });

  await t.test('8. User Management: Super Admin updates user role and status', async () => {
    const roleRes = await makeRequest(app, {
      method: 'PATCH',
      path: `/api/admin/users/${normalUser._id}/role`,
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { role: 'admin' }
    });
    assert.strictEqual(roleRes.status, 200);
    assert.strictEqual(roleRes.body.data.user.role, 'admin');

    const statusRes = await makeRequest(app, {
      method: 'PATCH',
      path: `/api/admin/users/${normalUser._id}/status`,
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'suspended' }
    });
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.body.data.user.status, 'suspended');
  });

  await t.test('9. Research Management: Super Admin lists and archives research', async () => {
    const testResearch = await Research.create({
      userId: normalUser._id,
      title: 'بحث فقهي مقارن',
      currentStep: 3,
      status: 'in_progress',
      cover: { studentName: 'أحمد', university: 'جامعة الملك سعود' }
    });

    const listRes = await makeRequest(app, {
      method: 'GET',
      path: '/api/admin/researches',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.body.data.researches.length >= 1);

    const archiveRes = await makeRequest(app, {
      method: 'PATCH',
      path: `/api/admin/researches/${testResearch._id}`,
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'archived' }
    });
    assert.strictEqual(archiveRes.status, 200);
    assert.strictEqual(archiveRes.body.data.research.status, 'archived');
  });

  await t.test('10. Activity Log: Actions are recorded properly in ActivityLog', async () => {
    const activityRes = await makeRequest(app, {
      method: 'GET',
      path: '/api/admin/activity',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(activityRes.status, 200);
    assert.ok(activityRes.body.data.logs.length > 0, 'Activity logs must contain recorded admin actions');
  });
});
