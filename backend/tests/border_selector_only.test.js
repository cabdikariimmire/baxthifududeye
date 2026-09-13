const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const defaultBorders = require('../src/services/document/defaultBorders');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('Task 1: Single Page Border Selector & Default No Border', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'باحث الأطر الأكاديمية',
      email: `border_test_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
    await mongoose.disconnect();
  });

  // 1 & 2. Default is "بدون إطار" (none)
  test('1. Every new research defaults to borderId: "none" (بدون إطار)', async () => {
    testResearch = await Research.create({
      userId: testUser._id,
      title: 'بحث تجربة الأطر الأكاديمية'
    });

    assert.strictEqual(testResearch.borderId, 'none');

    const doc = DocumentBuilder.buildDocument(testResearch);
    assert.strictEqual(doc.borderId, 'none');
    assert.strictEqual(doc.border.svgPattern, '', 'No decorative SVG should be present by default');
  });

  // 3 & 4. Only selected border is rendered (no multiple simultaneous borders)
  test('2. Selecting a border applies ONLY that specific border and removes others', async () => {
    // Select stars
    testResearch.borderId = 'stars';
    await testResearch.save();

    let doc = DocumentBuilder.buildDocument(testResearch);
    assert.strictEqual(doc.borderId, 'stars');
    assert.ok(doc.border.svgPattern.includes('polygon'), 'Stars border should have star polygons');
    assert.ok(!doc.border.svgPattern.includes('stroke="#2D5A27"'), 'Should NOT have floral green stroke');

    // Switch to floral
    testResearch.borderId = 'floral';
    await testResearch.save();

    doc = DocumentBuilder.buildDocument(testResearch);
    assert.strictEqual(doc.borderId, 'floral');
    assert.ok(doc.border.svgPattern.includes('#2D5A27'), 'Floral border should be active');
    assert.ok(!doc.border.svgPattern.includes('fill="#FFD700"'), 'Stars should have disappeared');

    // Switch to islamic
    testResearch.borderId = 'islamic';
    await testResearch.save();

    doc = DocumentBuilder.buildDocument(testResearch);
    assert.strictEqual(doc.borderId, 'islamic');
    assert.ok(doc.border.svgPattern.includes('#1B4D3E'), 'Islamic border active');

    // Switch back to none
    testResearch.borderId = 'none';
    await testResearch.save();

    doc = DocumentBuilder.buildDocument(testResearch);
    assert.strictEqual(doc.borderId, 'none');
    assert.strictEqual(doc.border.svgPattern, '', 'All decorative borders disappear');
  });

  // 5. Existing border designs preserved
  test('3. All 10 existing academic borders remain available internally', () => {
    assert.strictEqual(defaultBorders.length, 10);
    const expectedIds = ['none', 'stars', 'floral', 'islamic', 'classic', 'elegant', 'geometric', 'corners', 'minimal', 'double'];
    expectedIds.forEach((id) => {
      const found = defaultBorders.find((b) => b.borderId === id || b.id === id);
      assert.ok(found, `Border ${id} must exist in defaultBorders`);
    });
  });

  // 6. Persistence across reload/reopen
  test('4. Selected borderId persists correctly in database and reloads seamlessly', async () => {
    testResearch.borderId = 'classic';
    await testResearch.save();

    const reloaded = await Research.findById(testResearch._id);
    assert.strictEqual(reloaded.borderId, 'classic');
  });

  // 7. PDF generation with selected border
  test('5. PDF generator correctly processes selected borderId without error', async () => {
    testResearch.borderId = 'stars';
    const pdfBuf = await PDFGenerator.generatePDF(testResearch);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 10000);
  });

  // 8. DOCX generation with selected border
  test('6. DOCX generator correctly processes selected borderId without error', async () => {
    testResearch.borderId = 'classic';
    const docxBuf = await DocxGenerator.generateDocx(testResearch);
    assert.ok(Buffer.isBuffer(docxBuf));
    assert.ok(docxBuf.length > 8000);
  });
});
