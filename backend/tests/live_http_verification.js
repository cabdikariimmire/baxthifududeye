const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('../src/config/env');
const JWT_SECRET = config.jwtSecret;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runLiveVerification() {
  console.log('--- Starting Live HTTP Verification against http://localhost:5000 ---');

  await mongoose.connect('mongodb://localhost:27017/ai_research_assistant');
  const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    role: String,
    status: String,
    name: String,
    passwordHash: String
  }));

  // Create or find a test normal user and a test admin user
  let normalUser = await User.findOne({ email: 'live_test_normal@test.com' });
  if (!normalUser) {
    normalUser = await User.create({
      name: 'Normal Test User',
      email: 'live_test_normal@test.com',
      role: 'user',
      status: 'active'
    });
  }

  let adminUser = await User.findOne({ email: 'live_test_admin@test.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin Test User',
      email: 'live_test_admin@test.com',
      role: 'admin',
      status: 'active'
    });
  } else if (adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    await adminUser.save();
  }

  const normalToken = jwt.sign({ id: normalUser._id, email: normalUser.email, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminUser._id, email: adminUser.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  // 1. Normal user hitting /api/admin/stats -> Expected 403 Forbidden
  const normalStatsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${normalToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('1. Normal user hitting /api/admin/stats -> Status:', normalStatsRes.statusCode);
  if (normalStatsRes.statusCode !== 403) {
    throw new Error(`Expected 403 for normal user, got ${normalStatsRes.statusCode}`);
  }
  console.log('   Body:', normalStatsRes.body);

  // 2. Admin user hitting /api/admin/stats -> Expected 200 with real DB metrics
  const adminStatsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('2. Admin user hitting /api/admin/stats -> Status:', adminStatsRes.statusCode);
  if (adminStatsRes.statusCode !== 200 || !adminStatsRes.body.success) {
    throw new Error(`Expected 200 and success for admin stats, got ${adminStatsRes.statusCode}`);
  }
  console.log('   Real DB Stats:', adminStatsRes.body.data);

  // 3. Admin user listing users -> /api/admin/users
  const adminUsersRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users?limit=5',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('3. Admin user listing users -> Status:', adminUsersRes.statusCode);
  if (adminUsersRes.statusCode !== 200 || !adminUsersRes.body.success) {
    throw new Error(`Expected 200 for admin users list`);
  }
  console.log(`   Fetched ${adminUsersRes.body.data.users.length} users, total: ${adminUsersRes.body.data.total}`);

  // 4. Admin user listing researches -> /api/admin/researches
  const adminResearchesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/researches?limit=5',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('4. Admin user listing researches -> Status:', adminResearchesRes.statusCode);
  if (adminResearchesRes.statusCode !== 200 || !adminResearchesRes.body.success) {
    throw new Error(`Expected 200 for admin researches list`);
  }
  console.log(`   Fetched ${adminResearchesRes.body.data.researches.length} researches, total: ${adminResearchesRes.body.data.total}`);

  // 5. Admin user fetching activity logs -> /api/admin/activity
  const adminActivityRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/activity?limit=5',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('5. Admin user listing activity -> Status:', adminActivityRes.statusCode);
  if (adminActivityRes.statusCode !== 200 || !adminActivityRes.body.success) {
    throw new Error(`Expected 200 for activity list`);
  }
  console.log(`   Fetched ${adminActivityRes.body.data.logs.length} activity logs, total: ${adminActivityRes.body.data.total}`);

  // 6. Admin user fetching settings -> /api/admin/settings
  const adminSettingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/settings',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('6. Admin user reading settings -> Status:', adminSettingsRes.statusCode);
  if (adminSettingsRes.statusCode !== 200 || !adminSettingsRes.body.success) {
    throw new Error(`Expected 200 for admin settings`);
  }
  console.log('   System Info:', adminSettingsRes.body.data.systemInfo);
  console.log('   Settings customApiKey masked:', adminSettingsRes.body.data.aiSettings.customApiKey);
  if (adminSettingsRes.body.data.aiSettings.customApiKey && !adminSettingsRes.body.data.aiSettings.customApiKey.includes('••••')) {
    throw new Error('API key was not properly masked!');
  }

  // 7. Last active admin protection live check
  // Temporarily ensure adminUser is the only admin
  await User.updateMany({ _id: { $ne: adminUser._id }, role: 'admin' }, { $set: { role: 'user' } });
  const demoteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${adminUser._id}/role`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, { role: 'user' });
  console.log('7. Attempt to demote sole admin -> Status:', demoteRes.statusCode);
  if (demoteRes.statusCode !== 400 || !demoteRes.body.message.includes('المسؤول الأخير')) {
    throw new Error(`Expected 400 with last-admin error message, got ${demoteRes.statusCode}: ${JSON.stringify(demoteRes.body)}`);
  }
  console.log('   Message:', demoteRes.body.message);

  // Ensure primary active admin user exists
  const mainUser = await User.findOne({ role: 'admin' });
  if (mainUser) {
    mainUser.role = 'admin';
    await mainUser.save();
  }

  // Also clean up test users
  await User.deleteMany({ email: { $in: ['live_test_normal@test.com', 'live_test_admin@test.com'] } });

  console.log('\n--- ALL LIVE HTTP VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
  await mongoose.disconnect();
}

runLiveVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
