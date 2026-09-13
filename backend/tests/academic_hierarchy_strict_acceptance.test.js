const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  detectAcademicLevel,
  hasMabhathLevel,
  getHighestAcademicLevel,
  formatAcademicHeadingTitle,
  resolveAcademicHeadingStyle,
  stripAcademicPrefix,
  ACADEMIC_LEVELS
} = require('../src/services/document/academicHierarchy');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('Strict Dynamic Academic Hierarchy & Typography Acceptance Tests', () => {
  // =========================================================================
  // TEST 1: Structure: المبحث -> المطلب -> الفرع
  // Expected:
  // - المبحث = 18pt Bold Center + numbered
  // - المطلب = 17pt Bold Right + NOT main-level numbered
  // - الفرع = 17pt Bold Right + subordinate
  // =========================================================================
  it('TEST 1: Structure with المبحث -> المطلب -> الفرع renders correctly', () => {
    const research = {
      title: 'أحكام الاعتكاف في الفقه الإسلامي',
      structure: {
        detectedMataleeb: [
          {
            title: 'أحكام الاعتكاف ومقاصده',
            level: 'mabhath',
            order: 1,
            branches: [
              { title: 'تعريف الاعتكاف', level: 'matalab', order: 1 },
              { title: 'المعنى اللغوي', level: 'branch', order: 2 }
            ]
          }
        ]
      },
      topics: [
        {
          topicId: 'topic-1',
          h1Title: 'المبحث الأول: أحكام الاعتكاف ومقاصده',
          rawContent: 'المطلب: تعريف الاعتكاف\nالفرع: المعنى اللغوي\nنص الفقرة الأولى...'
        }
      ]
    };

    const hasMabhath = hasMabhathLevel(research.topics, research);
    assert.strictEqual(hasMabhath, true, 'hasMabhath must be true when المبحث exists');

    const highest = getHighestAcademicLevel(research.topics, research);
    assert.strictEqual(highest, ACADEMIC_LEVELS.MABHATH, 'Highest level must be mabhath');

    // 1. Mabhath heading style and title
    const mabhathStyle = resolveAcademicHeadingStyle('المبحث الأول: أحكام الاعتكاف ومقاصده', highest);
    assert.strictEqual(mabhathStyle.fontSizePt, 18, 'المبحث must be 18pt');
    assert.strictEqual(mabhathStyle.fontWeight, 'bold', 'المبحث must be bold');
    assert.strictEqual(mabhathStyle.textAlign, 'center', 'المبحث must be centered');
    assert.strictEqual(mabhathStyle.isMainHeading, true, 'المبحث must be main heading');

    const mabhathFormatted = formatAcademicHeadingTitle('أحكام الاعتكاف ومقاصده', ACADEMIC_LEVELS.MABHATH, { hasMabhath, index: 0 });
    assert.strictEqual(mabhathFormatted, 'المبحث الأول: أحكام الاعتكاف ومقاصده', 'المبحث must be numbered: المبحث الأول');

    // 2. Matalab heading style and title (SUBORDINATE when المبحث exists)
    const matalabStyle = resolveAcademicHeadingStyle('المطلب: تعريف الاعتكاف', highest);
    assert.strictEqual(matalabStyle.fontSizePt, 17, 'المطلب under المبحث must be 17pt');
    assert.strictEqual(matalabStyle.fontWeight, 'bold', 'المطلب under المبحث must be bold');
    assert.strictEqual(matalabStyle.textAlign, 'right', 'المطلب under المبحث must be right-aligned (NEVER centered)');
    assert.strictEqual(matalabStyle.isMainHeading, false, 'المطلب under المبحث must NOT be main heading');
    assert.strictEqual(matalabStyle.isSubHeading, true, 'المطلب under المبحث must be subheading');

    // Numbering: formatted subordinate Matlab (المطلب الأول: ...)
    const matalabFormatted = formatAcademicHeadingTitle('المطلب الأول: تعريف الاعتكاف', ACADEMIC_LEVELS.MATALAB, { hasMabhath, index: 0 });
    assert.strictEqual(matalabFormatted, 'المطلب الأول: تعريف الاعتكاف', 'المطلب under المبحث must be numbered correctly');

    // 3. Branch heading style and title
    const branchStyle = resolveAcademicHeadingStyle('الفرع: المعنى اللغوي', highest);
    assert.strictEqual(branchStyle.fontSizePt, 17, 'الفرع must be 17pt');
    assert.strictEqual(branchStyle.fontWeight, 'bold', 'الفرع must be bold');
    assert.strictEqual(branchStyle.textAlign, 'right', 'الفرع must be right-aligned');
  });

  // =========================================================================
  // TEST 2: Structure: المبحث -> المطلب (No فروع)
  // Expected:
  // - المبحث = 18pt Bold Center + numbered
  // - المطلب = 17pt Bold Right + numbered
  // =========================================================================
  it('TEST 2: Structure with المبحث -> المطلب (No فروع) renders correctly', () => {
    const research = {
      title: 'دراسة فقهية',
      topics: [
        {
          topicId: 'topic-1',
          h1Title: 'المبحث الأول: الإطار المفاهيمي',
          rawContent: 'المطلب: التعريف العام\nنص المطلب هنا...'
        }
      ]
    };

    const hasMabhath = hasMabhathLevel(research.topics, research);
    assert.strictEqual(hasMabhath, true);

    const highest = getHighestAcademicLevel(research.topics, research);
    assert.strictEqual(highest, ACADEMIC_LEVELS.MABHATH);

    // Mabhath: 18pt Bold Centered + numbered
    const mStyle = resolveAcademicHeadingStyle('المبحث الأول: الإطار المفاهيمي', highest);
    assert.strictEqual(mStyle.fontSizePt, 18);
    assert.strictEqual(mStyle.textAlign, 'center');

    // Matalab: 17pt Bold Right + numbered
    const matalabStyle = resolveAcademicHeadingStyle('المطلب: التعريف العام', highest);
    assert.strictEqual(matalabStyle.fontSizePt, 17);
    assert.strictEqual(matalabStyle.textAlign, 'right');

    const formattedMatlab = formatAcademicHeadingTitle('المطلب الأول: التعريف العام', ACADEMIC_LEVELS.MATALAB, { hasMabhath, index: 0 });
    assert.strictEqual(formattedMatlab, 'المطلب الأول: التعريف العام');
  });

  // =========================================================================
  // TEST 3: Structure: المطلب -> الفرع (No مباحث)
  // Expected:
  // - المطلب = 18pt Bold Center + numbered
  // - الفرع = 17pt Bold Right
  // =========================================================================
  it('TEST 3: Structure with المطلب -> الفرع (No مباحث) makes المطلب the MAIN TOPIC (18pt Bold Center + numbered)', () => {
    const research = {
      title: 'بحث بدون مباحث',
      topics: [
        {
          topicId: 'topic-1',
          h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
          rawContent: 'الفرع الأول: المعنى اللغوي\nنص الفرع الأول...'
        }
      ]
    };

    const hasMabhath = hasMabhathLevel(research.topics, research);
    assert.strictEqual(hasMabhath, false, 'hasMabhath must be false when no مبحث exists');

    const highest = getHighestAcademicLevel(research.topics, research);
    assert.strictEqual(highest, ACADEMIC_LEVELS.MATALAB, 'Highest level must be matalab');

    // Matalab is now MAIN TOPIC: 18pt Bold Centered + numbered (المطلب الأول: ...)
    const matalabStyle = resolveAcademicHeadingStyle('المطلب الأول: تعريف الاعتكاف ومشروعيته', highest);
    assert.strictEqual(matalabStyle.fontSizePt, 18, 'المطلب without مبحث must be 18pt');
    assert.strictEqual(matalabStyle.fontWeight, 'bold', 'المطلب without مبحث must be bold');
    assert.strictEqual(matalabStyle.textAlign, 'center', 'المطلب without مبحث must be centered');
    assert.strictEqual(matalabStyle.isMainHeading, true, 'المطلب without مبحث must be main heading');

    const formattedMatlab = formatAcademicHeadingTitle('تعريف الاعتكاف ومشروعيته', ACADEMIC_LEVELS.MATALAB, { hasMabhath, index: 0 });
    assert.strictEqual(formattedMatlab, 'المطلب الأول: تعريف الاعتكاف ومشروعيته', 'المطلب without مبحث MUST be numbered: المطلب الأول');

    // Branch remains subordinate: 17pt Bold Right
    const branchStyle = resolveAcademicHeadingStyle('الفرع الأول: المعنى اللغوي', highest);
    assert.strictEqual(branchStyle.fontSizePt, 17, 'الفرع must be 17pt');
    assert.strictEqual(branchStyle.textAlign, 'right', 'الفرع must be right-aligned');
  });

  // =========================================================================
  // TEST 4: Start with: المطلب -> الفرع. Then ADD: المبحث.
  // Expected:
  // System automatically recalculates hierarchy and changes المطلب to subordinate styling.
  // =========================================================================
  it('TEST 4: Adding a مبحث dynamically recalculates hierarchy and changes المطلب from main-topic to subordinate', () => {
    // Initial structure: only mataleeb
    const initialStructure = [
      { title: 'تعريف الاعتكاف', level: 'matalab', branches: [{ title: 'المعنى اللغوي', level: 'branch' }] }
    ];

    let hasMabhath = hasMabhathLevel(initialStructure);
    assert.strictEqual(hasMabhath, false);
    let highest = getHighestAcademicLevel(initialStructure);
    assert.strictEqual(highest, ACADEMIC_LEVELS.MATALAB);

    // Initial styling: Matalab is 18pt Center + numbered
    let matalabStyle = resolveAcademicHeadingStyle(initialStructure[0], highest);
    assert.strictEqual(matalabStyle.fontSizePt, 18);
    assert.strictEqual(matalabStyle.textAlign, 'center');
    let formatted = formatAcademicHeadingTitle(initialStructure[0].title, ACADEMIC_LEVELS.MATALAB, { hasMabhath, index: 0 });
    assert.strictEqual(formatted, 'المطلب الأول: تعريف الاعتكاف');

    // NOW ADD A MABHATH
    const updatedStructure = [
      { title: 'أحكام الاعتكاف', level: 'mabhath', branches: [] },
      ...initialStructure
    ];

    hasMabhath = hasMabhathLevel(updatedStructure);
    assert.strictEqual(hasMabhath, true, 'hasMabhath must become true upon adding مبحث');
    highest = getHighestAcademicLevel(updatedStructure);
    assert.strictEqual(highest, ACADEMIC_LEVELS.MABHATH, 'Highest level must switch to mabhath');

    // Mabhath becomes 18pt Center + numbered
    const mabhathStyle = resolveAcademicHeadingStyle(updatedStructure[0], highest);
    assert.strictEqual(mabhathStyle.fontSizePt, 18);
    assert.strictEqual(mabhathStyle.textAlign, 'center');
    const mabhathFormatted = formatAcademicHeadingTitle(updatedStructure[0].title, ACADEMIC_LEVELS.MABHATH, { hasMabhath, index: 0 });
    assert.strictEqual(mabhathFormatted, 'المبحث الأول: أحكام الاعتكاف');

    // Matalab AUTOMATICALLY becomes 17pt Right (subordinate)
    matalabStyle = resolveAcademicHeadingStyle(updatedStructure[1], highest);
    assert.strictEqual(matalabStyle.fontSizePt, 17, 'المطلب must become 17pt');
    assert.strictEqual(matalabStyle.textAlign, 'right', 'المطلب must become right-aligned');
    assert.strictEqual(matalabStyle.isMainHeading, false, 'المطلب must no longer be main heading');
    formatted = formatAcademicHeadingTitle(updatedStructure[1].title, ACADEMIC_LEVELS.MATALAB, { hasMabhath, index: 0 });
    assert.strictEqual(formatted, 'المطلب الأول: تعريف الاعتكاف', 'المطلب must receive canonical numbering');
  });

  // =========================================================================
  // TEST 5: REMOVE the المبحث.
  // Expected:
  // المطلب automatically becomes the main topic again: 18pt + Bold + Centered + numbered.
  // =========================================================================
  it('TEST 5: Removing the last مبحث automatically returns المطلب to main topic (18pt Bold Center + numbered)', () => {
    // Structure with mabhath
    const structureWithMabhath = [
      { title: 'المبحث الأول: أحكام الاعتكاف', level: 'mabhath' },
      { title: 'المطلب: تعريف الاعتكاف', level: 'matalab' }
    ];

    let hasMabhath = hasMabhathLevel(structureWithMabhath);
    assert.strictEqual(hasMabhath, true);

    // REMOVE THE MABHATH
    const structureAfterRemoval = structureWithMabhath.filter(i => i.level !== 'mabhath');

    hasMabhath = hasMabhathLevel(structureAfterRemoval);
    assert.strictEqual(hasMabhath, false, 'hasMabhath must become false after removal');

    const highest = getHighestAcademicLevel(structureAfterRemoval);
    assert.strictEqual(highest, ACADEMIC_LEVELS.MATALAB, 'Highest level must revert to matalab');

    // Matalab automatically returns to 18pt Center + numbered (المطلب الأول: ...)
    const matalabStyle = resolveAcademicHeadingStyle(structureAfterRemoval[0], highest);
    assert.strictEqual(matalabStyle.fontSizePt, 18, 'المطلب must return to 18pt');
    assert.strictEqual(matalabStyle.fontWeight, 'bold', 'المطلب must return to bold');
    assert.strictEqual(matalabStyle.textAlign, 'center', 'المطلب must return to centered');
    assert.strictEqual(matalabStyle.isMainHeading, true, 'المطلب must return to main heading');

    const formatted = formatAcademicHeadingTitle(structureAfterRemoval[0].title, ACADEMIC_LEVELS.MATALAB, { hasMabhath, index: 0 });
    assert.strictEqual(formatted, 'المطلب الأول: تعريف الاعتكاف', 'المطلب must automatically receive "المطلب الأول: ..." numbering');
  });

  // =========================================================================
  // TEST 6: Verify full DocumentBuilder, PDF, and DOCX generation with Dynamic Hierarchy
  // =========================================================================
  it('TEST 6: DocumentBuilder, PDF HTML, and DOCX Generator handle dynamic hierarchy correctly in both cases', async () => {
    const researchWithMabhath = {
      title: 'بحث مع مباحث',
      topics: [
        {
          topicId: 't-1',
          h1Title: 'المبحث الأول: الإطار المفاهيمي',
          rawContent: 'المطلب: التعريف\nالفرع: المعنى اللغوي\nنص الفقرة...'
        }
      ]
    };

    const docWithMabhath = DocumentBuilder.buildDocument(researchWithMabhath);
    const pdfHtml = PDFGenerator.buildDocumentHTML(docWithMabhath);
    assert.ok(pdfHtml.includes('font-size: 18pt'), 'PDF HTML must include 18pt main heading');
    assert.ok(pdfHtml.includes('المبحث الأول'), 'PDF HTML must render numbered المبحث الأول');

    const docxBuf = await DocxGenerator.generateDocx(researchWithMabhath);
    assert.ok(docxBuf && docxBuf.length > 0, 'DOCX Buffer must be created successfully');
  });
});
