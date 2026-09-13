const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  detectAcademicLevel,
  getHighestAcademicLevel,
  resolveAcademicHeadingStyle,
  ACADEMIC_LEVELS
} = require('../src/services/document/academicHierarchy');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('Dynamic Academic Heading Hierarchy & Typography System', () => {

  test('TEST A: Hierarchy with المبحث + المطلب + الفرع', () => {
    const blocks = [
      { type: 'mabhath', text: 'المبحث الأول: أحكام الاعتكاف' },
      { type: 'matalab', text: 'المطلب الأول: تعريف الاعتكاف' },
      { type: 'branch', text: 'الفرع الأول: المعنى اللغوي' },
      { type: 'paragraph', text: 'نص المتن والبحث الأكاديمي.' }
    ];

    const highest = getHighestAcademicLevel(blocks);
    assert.equal(highest, ACADEMIC_LEVELS.MABHATH, 'Highest level must be mabhath');

    const mabhathStyle = resolveAcademicHeadingStyle(blocks[0], highest);
    assert.equal(mabhathStyle.isMainHeading, true);
    assert.equal(mabhathStyle.fontSizePt, 18);
    assert.equal(mabhathStyle.fontWeight, 'bold');
    assert.equal(mabhathStyle.textAlign, 'center');

    const matalabStyle = resolveAcademicHeadingStyle(blocks[1], highest);
    assert.equal(matalabStyle.isSubHeading, true);
    assert.equal(matalabStyle.fontSizePt, 17);
    assert.equal(matalabStyle.fontWeight, 'bold');
    assert.equal(matalabStyle.textAlign, 'right');

    const branchStyle = resolveAcademicHeadingStyle(blocks[2], highest);
    assert.equal(branchStyle.isSubHeading, true);
    assert.equal(branchStyle.fontSizePt, 17);
    assert.equal(branchStyle.fontWeight, 'bold');
    assert.equal(branchStyle.textAlign, 'right');

    const bodyStyle = resolveAcademicHeadingStyle(blocks[3], highest);
    assert.equal(bodyStyle.isBody, true);
    assert.equal(bodyStyle.fontSizePt, 16);
    assert.equal(bodyStyle.fontWeight, 'normal');
    assert.equal(bodyStyle.textAlign, 'justify');
  });

  test('TEST B: Hierarchy with المبحث + المطلب (No فروع)', () => {
    const blocks = [
      { type: 'mabhath', text: 'المبحث الأول: أحكام الاعتكاف' },
      { type: 'matalab', text: 'المطلب الأول: تعريف الاعتكاف' },
      { type: 'paragraph', text: 'نص المتن والبحث الأكاديمي.' }
    ];

    const highest = getHighestAcademicLevel(blocks);
    assert.equal(highest, ACADEMIC_LEVELS.MABHATH);

    const mabhathStyle = resolveAcademicHeadingStyle(blocks[0], highest);
    assert.equal(mabhathStyle.fontSizePt, 18);
    assert.equal(mabhathStyle.textAlign, 'center');

    const matalabStyle = resolveAcademicHeadingStyle(blocks[1], highest);
    assert.equal(matalabStyle.fontSizePt, 17);
    assert.equal(matalabStyle.textAlign, 'right');
  });

  test('TEST C: Hierarchy with المطلب + الفرع (No مبحث)', () => {
    const blocks = [
      { type: 'matalab', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
      { type: 'branch', text: 'الفرع الأول: المعنى اللغوي' },
      { type: 'paragraph', text: 'نص المتن والبحث الأكاديمي.' }
    ];

    const highest = getHighestAcademicLevel(blocks);
    assert.equal(highest, ACADEMIC_LEVELS.MATALAB, 'Highest level must be matalab');

    const matalabStyle = resolveAcademicHeadingStyle(blocks[0], highest);
    assert.equal(matalabStyle.isMainHeading, true);
    assert.equal(matalabStyle.fontSizePt, 18);
    assert.equal(matalabStyle.fontWeight, 'bold');
    assert.equal(matalabStyle.textAlign, 'center');

    const branchStyle = resolveAcademicHeadingStyle(blocks[1], highest);
    assert.equal(branchStyle.isSubHeading, true);
    assert.equal(branchStyle.fontSizePt, 17);
    assert.equal(branchStyle.fontWeight, 'bold');
    assert.equal(branchStyle.textAlign, 'right');
  });

  test('TEST D: Dynamic recalculation when adding and removing المبحث', () => {
    // Initial state: Only مطلب and فرع
    const initialStructure = [
      { title: 'المطلب الأول: تعريف الاعتكاف', order: 1 }
    ];
    let highest = getHighestAcademicLevel([], { structure: { detectedMataleeb: initialStructure } });
    assert.equal(highest, ACADEMIC_LEVELS.MATALAB);

    let مطلبStyle = resolveAcademicHeadingStyle('المطلب الأول: تعريف الاعتكاف', highest);
    assert.equal(مطلبStyle.fontSizePt, 18);
    assert.equal(مطلبStyle.textAlign, 'center');

    // Dynamically Add مبحث
    const structureWithMabhath = [
      { title: 'المبحث الأول: أحكام عامة', order: 1 },
      { title: 'المطلب الأول: تعريف الاعتكاف', order: 2 }
    ];
    highest = getHighestAcademicLevel([], { structure: { detectedMataleeb: structureWithMabhath } });
    assert.equal(highest, ACADEMIC_LEVELS.MABHATH);

    const مبحثStyle = resolveAcademicHeadingStyle('المبحث الأول: أحكام عامة', highest);
    assert.equal(مبحثStyle.fontSizePt, 18);
    assert.equal(مبحثStyle.textAlign, 'center');

    مطلبStyle = resolveAcademicHeadingStyle('المطلب الأول: تعريف الاعتكاف', highest);
    assert.equal(مطلبStyle.fontSizePt, 17);
    assert.equal(مطلبStyle.textAlign, 'right');

    // Dynamically Remove مبحث
    highest = getHighestAcademicLevel([], { structure: { detectedMataleeb: initialStructure } });
    assert.equal(highest, ACADEMIC_LEVELS.MATALAB);

    مطلبStyle = resolveAcademicHeadingStyle('المطلب الأول: تعريف الاعتكاف', highest);
    assert.equal(مطلبStyle.fontSizePt, 18);
    assert.equal(مطلبStyle.textAlign, 'center');
  });

  test('TEST E: Full Document PDF & DOCX generation with Dynamic Hierarchy', async () => {
    const researchCase1 = {
      _id: '507f1f77bcf86cd799439011',
      title: 'أحكام الاعتكاف في الفقه الإسلامي',
      cover: {
        country: 'جمهورية الصومال الفيدرالية',
        university: 'جامعة هرمود',
        college: 'كلية الشريعة والقانون',
        department: 'قسم الفقه وأصوله',
        subject: 'الفقه المقارن',
        title: 'أحكام الاعتكاف في الفقه الإسلامي',
        studentName: 'محمد إبراهيم عيد',
        supervisor: 'د. عبد الله الشافعي',
        academicYear: '1447–1448هـ',
        gregorianYear: '2025–2026م',
        borderId: 'border-geometric-01'
      },
      introduction: {
        title: 'المقدمة وخطة البحث',
        opening: 'الحمد لله رب العالمين والصلاة والسلام على أشرف الأنبياء والمرسلين، أما بعد:',
        text: 'فإن الاعتكاف من السنن المؤكدة.'
      },
      topics: [
        {
          topicId: 'topic-1',
          h1Title: 'المبحث الأول: الإطار المفاهيمي للاعتكاف',
          order: 1,
          status: 'complete',
          rawContent: `المطلب الأول: المعنى اللغوي للاعتكاف\nهو لزوم الشيء وحبس النفس عليه (1).\nالفرع الأول: دلالة اللزوم في القرآن\nقال تعالى حكاية عن الخليل عليه السلام.`,
          footnotes: [
            {
              footnoteId: 'fn-1-1',
              number: 1,
              marker: '(1)',
              text: 'لسان العرب، ابن منظور، دار صادر، بيروت، ج9، ص 255'
            }
          ]
        }
      ],
      conclusion: {
        title: 'الخاتمة',
        opening: 'الحمد لله الذي بنعمته تتم الصالحات.',
        points: ['مشروعية الاعتكاف.', 'أهمية الخلوة الروحية.']
      },
      references: [
        {
          id: 'ref-1',
          book: 'لسان العرب',
          author: 'ابن منظور',
          order: 1,
          displayText: 'لسان العرب، ابن منظور، دار صادر، بيروت، 1414هـ.'
        }
      ]
    };

    const docModel = DocumentBuilder.buildDocument(researchCase1);
    assert.ok(docModel.pages.length >= 5, 'Should generate all sections');

    const pdfBuffer = await PDFGenerator.generatePDF(docModel, { printBackground: true });
    assert.ok(pdfBuffer && pdfBuffer.length > 5000, 'PDF should be generated successfully');

    const docxBuffer = await DocxGenerator.generateDocx(researchCase1);
    assert.ok(docxBuffer && docxBuffer.length > 5000, 'DOCX should be generated successfully');
  });

});
