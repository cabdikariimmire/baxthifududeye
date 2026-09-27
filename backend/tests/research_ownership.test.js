const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const researchController = require('../src/controllers/researchController');

describe('Research Ownership & Isolation Security', () => {
  let userA, userB;
  let researchUserA;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    await User.deleteMany({ email: /@ownership_test\.edu$/ });
    await Research.deleteMany({ title: /Ownership Test/ });

    userA = await User.create({
      name: 'باحث أ',
      email: 'userA@ownership_test.edu',
      role: 'user',
      status: 'active',
      emailVerified: true
    });

    userB = await User.create({
      name: 'باحث ب',
      email: 'userB@ownership_test.edu',
      role: 'user',
      status: 'active',
      emailVerified: true
    });

    researchUserA = await Research.create({
      userId: userA._id,
      title: 'Ownership Test Research A',
      status: 'draft',
      cover: { title: 'Ownership Test Research A' }
    });
  });

  after(async () => {
    await User.deleteMany({ email: /@ownership_test\.edu$/ });
    await Research.deleteMany({ title: /Ownership Test/ });
    await mongoose.disconnect();
  });

  const createMockReqRes = (user, params = {}, body = {}) => {
    let statusCode = 200;
    let responseData = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };
    return {
      req: { user, params, body },
      res,
      getStatus: () => statusCode,
      getData: () => responseData
    };
  };

  test('Owner (User A) can view their research by ID', async () => {
    const { req, res, getStatus, getData } = createMockReqRes(userA, { id: researchUserA._id.toString() });
    await researchController.getResearchById(req, res, () => {});
    assert.strictEqual(getStatus(), 200);
    assert.strictEqual(getData().success, true);
    assert.strictEqual(getData().data.research._id.toString(), researchUserA._id.toString());
  });

  test('Non-Owner (User B) CANNOT view User A research by ID (returns 404 NOT_FOUND)', async () => {
    const { req, res, getStatus, getData } = createMockReqRes(userB, { id: researchUserA._id.toString() });
    await researchController.getResearchById(req, res, () => {});
    assert.strictEqual(getStatus(), 404);
    assert.strictEqual(getData().success, false);
    assert.strictEqual(getData().code, 'NOT_FOUND');
  });

  test('Non-Owner (User B) CANNOT edit User A research by ID (returns 404 NOT_FOUND)', async () => {
    const { req, res, getStatus, getData } = createMockReqRes(
      userB,
      { id: researchUserA._id.toString() },
      { title: 'Hacked Title' }
    );
    await researchController.updateResearch(req, res, () => {});
    assert.strictEqual(getStatus(), 404);
    assert.strictEqual(getData().success, false);

    // Verify database document was NOT modified
    const unchanged = await Research.findById(researchUserA._id);
    assert.strictEqual(unchanged.title, 'Ownership Test Research A');
  });

  test('Non-Owner (User B) CANNOT delete User A research by ID (returns 404 NOT_FOUND)', async () => {
    const { req, res, getStatus, getData } = createMockReqRes(userB, { id: researchUserA._id.toString() });
    await researchController.deleteResearch(req, res, () => {});
    assert.strictEqual(getStatus(), 404);
    assert.strictEqual(getData().success, false);

    // Verify document still exists
    const stillExists = await Research.findById(researchUserA._id);
    assert.ok(stillExists);
  });

  test('List Researches only returns own researches', async () => {
    const { req, res, getStatus, getData } = createMockReqRes(userB);
    await researchController.listResearches(req, res, () => {});
    assert.strictEqual(getStatus(), 200);
    assert.strictEqual(getData().data.researches.length, 0); // User B has no researches
  });
});
