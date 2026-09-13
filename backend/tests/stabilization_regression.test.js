const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const config = require('../src/config/env');
const app = require('../src/app');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('Full Repository Stabilization & Security Regression Tests', () => {
  let server;
  let baseUrl;
  let normalUser;
  let otherUser;
  let adminUser;
  let normalToken;
  let otherToken;
  let adminToken;
  let userResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    // Clean up test data
    await User.deleteMany({ email: /stabilization_test/ });
    await Research.deleteMany({ title: /Stabilization Test/ });

    // Create test users
    normalUser = await User.create({
      name: 'Normal User',
      email: 'stabilization_test_normal@example.com',
      role: 'user',
      status: 'active'
    });

    otherUser = await User.create({
      name: 'Other User',
      email: 'stabilization_test_other@example.com',
      role: 'user',
      status: 'active'
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'stabilization_test_admin@example.com',
      role: 'admin',
      status: 'active'
    });

    normalToken = jwt.sign({ id: normalUser._id }, config.jwtSecret, { expiresIn: '1h' });
    otherToken = jwt.sign({ id: otherUser._id }, config.jwtSecret, { expiresIn: '1h' });
    adminToken = jwt.sign({ id: adminUser._id }, config.jwtSecret, { expiresIn: '1h' });

    // Create research belonging to normalUser
    userResearch = await Research.create({
      userId: normalUser._id,
      title: 'Stabilization Test Research Title',
      cover: {
        title: 'Stabilization Test Research Title',
        university: 'جامعة الملك سعود',
        college: 'كلية الشريعة',
        department: 'قسم الفقه',
        researcher: 'الباحث التجريبي',
        supervisor: 'المشرف التجريبي'
      },
      introduction: {
        opening: 'الحمد لله رب العالمين',
        text: 'مقدمة البحث التجريبية للاختبار والتحقق من الاستقرار.'
      },
      topics: [
        {
          topicId: 'topic-1',
          order: 1,
          h1Title: 'المطلب الأول: التعريف',
          blocks: [
            { type: 'h1', text: 'المطلب الأول: التعريف' },
            { type: 'paragraph', text: 'الفقرة الأولى في المطلب الأول تجريبية.' }
          ],
          footnotes: [
            {
              footnoteId: 'fn-1',
              number: 1,
              marker: '(1)',
              text: 'المرجع الأول ص 50.'
            }
          ]
        }
      ],
      references: [
        {
          order: 1,
          book: 'صحيح البخاري',
          author: 'محمد بن إسماعيل البخاري',
          year: '256هـ'
        }
      ]
    });

    // Start ephemeral server on random port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await User.deleteMany({ email: /stabilization_test/ });
    await Research.deleteMany({ title: /Stabilization Test/ });
  });

  test('1. Unauthenticated request to protected API returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/researches`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'UNAUTHORIZED');
  });

  test('2. Unsigned/fake JWT token returns 401 Unauthorized without crashing', async () => {
    // A forged token signed with a bogus secret
    const forgedToken = jwt.sign({ id: normalUser._id }, 'completely_wrong_secret_attacker_key');
    const res = await fetch(`${baseUrl}/api/researches`, {
      headers: { Authorization: `Bearer ${forgedToken}` }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('3. Expired token returns 401 Unauthorized', async () => {
    const expiredToken = jwt.sign({ id: normalUser._id }, config.jwtSecret, { expiresIn: -10 });
    const res = await fetch(`${baseUrl}/api/researches`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('4. Normal user requesting Admin API is strictly denied with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${normalToken}` }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('5. Admin user requesting Admin API succeeds with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(typeof body.data.stats.userCount === 'number');
    assert.ok(typeof body.data.stats.researchCount === 'number');
  });


  test('6. IDOR Protection: User B requesting User A research is rejected with 404 NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/api/researches/${userResearch._id}`, {
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOT_FOUND');
  });

  test('7. Owner User A requesting their own research succeeds with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/researches/${userResearch._id}`, {
      headers: { Authorization: `Bearer ${normalToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.research._id, String(userResearch._id));
  });

  test('8. Invalid ObjectId returns safe 400 or 404 without crashing or exposing stack traces', async () => {
    const res = await fetch(`${baseUrl}/api/researches/invalid-malformed-id`, {
      headers: { Authorization: `Bearer ${normalToken}` }
    });
    assert.ok([400, 404].includes(res.status));
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(typeof body.message, 'string');
    assert.equal(body.stack, undefined);
  });

  test('9. Admin updateUserRole prevents removing the last active administrator', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'user' })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'CANNOT_REMOVE_LAST_ADMIN');
  });

  test('10. DocumentBuilder and Exports produce valid A4 models without errors', async () => {
    const docModel = DocumentBuilder.buildDocument(userResearch);
    assert.ok(docModel.totalPages >= 5);
    assert.equal(docModel.pages[0].pageType, 'cover');

    // PDF generation
    const pdfBuf = await PDFGenerator.generatePDF(userResearch);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 1000);

    // DOCX generation
    const docxBuf = await DocxGenerator.generateDocx(userResearch);
    assert.ok(Buffer.isBuffer(docxBuf));
    assert.ok(docxBuf.length > 1000);
  });
});
