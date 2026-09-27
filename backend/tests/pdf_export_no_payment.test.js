const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const config = require('../src/config/env');
const User = require('../src/models/User');
const Research = require('../src/models/Research');

describe('PDF Export Without Payment — Complete Decoupling Acceptance Tests', () => {
  let server;
  let baseUrl;
  let userA, userB;
  let tokenA, tokenB;
  let researchA;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/ai_research_assistant');
    }

    await User.deleteMany({ email: /@pdf_no_payment\.test$/ });
    await Research.deleteMany({ title: /PDF No Payment/ });

    userA = await User.create({
      name: 'طالب أ',
      email: 'student_a@pdf_no_payment.test',
      passwordHash: 'dummyhash',
      role: 'user',
      status: 'active'
    });

    userB = await User.create({
      name: 'طالب ب',
      email: 'student_b@pdf_no_payment.test',
      passwordHash: 'dummyhash',
      role: 'user',
      status: 'active'
    });

    tokenA = jwt.sign({ id: userA._id, email: userA.email, role: userA.role }, config.jwtSecret);
    tokenB = jwt.sign({ id: userB._id, email: userB.email, role: userB.role }, config.jwtSecret);

    researchA = await Research.create({
      userId: userA._id,
      title: 'PDF No Payment Research A',
      status: 'ready',
      cover: {
        title: 'PDF No Payment Research A',
        university: 'جامعة العلوم والتقنية',
        studentName: 'طالب أ',
        supervisor: 'د. المشرف الأكاديمي',
        academicYear: '1447 هـ - 2026 م'
      },
      introduction: {
        text: 'هذه مقدمة تجريبية للبحث الأكاديمي القياسي للتأكد من تصدير PDF مباشرة بدون بوابة دفع.'
      },
      topics: [
        {
          topicId: 'topic-1',
          order: 1,
          h1Title: 'المطلب الأول: المفاهيم الأساسية',
          rawContent: 'محتوى المطلب الأول للتجربة والتأكد من التنسيق الأكاديمي القياسي A4.',
          blocks: [
            { type: 'h1', text: 'المطلب الأول: المفاهيم الأساسية' },
            { type: 'paragraph', text: 'محتوى المطلب الأول للتجربة والتأكد من التنسيق الأكاديمي القياسي A4.' }
          ],
          footnotes: [
            {
              footnoteId: 'fn-1-1',
              number: 1,
              marker: '(1)',
              text: 'ابن منظور، لسان العرب، دار صادر، ج1، ص10.'
            }
          ]
        }
      ],
      references: [
        {
          order: 1,
          book: 'لسان العرب',
          author: 'ابن منظور',
          publisher: 'دار صادر',
          city: 'بيروت',
          edition: 'الأولى',
          year: '1414 هـ'
        }
      ]
    });

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await User.deleteMany({ email: /@pdf_no_payment\.test$/ });
    await Research.deleteMany({ title: /PDF No Payment/ });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Payment routes are completely removed and return 404', async () => {
    const endpoints = [
      '/api/payments/checkout',
      '/api/payments/webhook',
      '/api/payments/verify',
      '/api/payments/pricing',
      `/api/payments/status/${researchA._id}`
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        method: ep.includes('checkout') || ep.includes('webhook') || ep.includes('verify') ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.strictEqual(res.status, 404, `Endpoint ${ep} should return 404 but got ${res.status}`);
    }
  });

  test('2. PDF export endpoint directly downloads PDF without any payment requirement', async () => {
    const res = await fetch(`${baseUrl}/api/researches/${researchA._id}/pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    assert.strictEqual(res.headers.get('content-type'), 'application/pdf');

    const buffer = Buffer.from(await res.arrayBuffer());
    assert.ok(buffer.length > 5000, 'PDF buffer should be valid size');
    // PDF Magic bytes check
    assert.strictEqual(buffer.slice(0, 4).toString(), '%PDF', 'File must start with %PDF magic bytes');
  });

  test('3. Printable HTML view works directly without payment requirement', async () => {
    const res = await fetch(`${baseUrl}/api/researches/${researchA._id}/printable`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('PDF No Payment Research A'));
    assert.ok(html.includes('المطلب الأول'));
  });

  test('4. Strict ownership security: User B cannot export User A research', async () => {
    const res = await fetch(`${baseUrl}/api/researches/${researchA._id}/pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.status, 404);
  });

  test('5. Strict ownership security: User B cannot view User A printable HTML', async () => {
    const res = await fetch(`${baseUrl}/api/researches/${researchA._id}/printable`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(res.status, 404);
  });

  test('6. Payment & Subscription models do not exist in codebase', () => {
    assert.throws(() => require('../src/models/Payment'), /Cannot find module/);
    assert.throws(() => require('../src/models/Subscription'), /Cannot find module/);
    assert.throws(() => require('../src/routes/payment.routes'), /Cannot find module/);
    assert.throws(() => require('../src/controllers/paymentController'), /Cannot find module/);
    assert.throws(() => require('../src/services/payment/soomarPayService'), /Cannot find module/);
  });
});
