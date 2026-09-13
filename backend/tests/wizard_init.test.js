const test = require('node:test');
const assert = require('node:assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Research = require('../src/models/Research');

test('Research creation endpoint works and returns valid research draft', async () => {
  await connectDB();

  const user = await User.create({
    name: 'مختبر المسار الجديد',
    email: `test_wizard_${Date.now()}@example.com`,
    passwordHash: await User.hashPassword('Pass123456!'),
    role: 'user'
  });

  const research = await Research.create({
    userId: user._id,
    title: 'بحث أكاديمي جديد',
    borderId: 'border-academic-red',
    currentStep: 1,
    status: 'draft'
  });

  assert.ok(research._id);
  assert.strictEqual(research.status, 'draft');
  assert.strictEqual(research.currentStep, 1);

  const found = await Research.findById(research._id);
  assert.ok(found);
  assert.strictEqual(found.title, 'بحث أكاديمي جديد');

  await disconnectDB();
});
