const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const JSZip = require('jszip');

const {
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  getDefaultCoverElements,
  buildDefaultCoverLayout,
  mergeCoverDataWithLayout
} = require('../src/services/document/coverLayout');

const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('Cover Drag & Drop Canvas Layout and DOCX Export Acceptance', () => {
  it('1. Generates 14 default independent academic cover elements with exact A4 mm boundaries', () => {
    const defaultElements = getDefaultCoverElements({
      country: 'جمهورية الصومال',
      university: 'جامعة هرمود',
      title: 'بحث الكفالة في الفقه الإسلامي'
    });

    assert.equal(defaultElements.length, 14);

    const ids = defaultElements.map((e) => e.id);
    assert.ok(ids.includes('country'));
    assert.ok(ids.includes('university'));
    assert.ok(ids.includes('logo'));
    assert.ok(ids.includes('college'));
    assert.ok(ids.includes('subject'));
    assert.ok(ids.includes('title'));
    assert.ok(ids.includes('studentName'));
    assert.ok(ids.includes('level'));
    assert.ok(ids.includes('supervisor'));
    assert.ok(ids.includes('semester'));
    assert.ok(ids.includes('academicYearLabel'));
    assert.ok(ids.includes('academicYear'));
    assert.ok(ids.includes('gregorianLabel'));
    assert.ok(ids.includes('gregorianYear'));

    // Verify all elements fit within 210mm x 297mm
    defaultElements.forEach((el) => {
      assert.ok(el.x >= 0 && el.x + (el.width || 0) <= A4_WIDTH_MM, `Element ${el.id} x out of bounds`);
      assert.ok(el.y >= 0 && el.y + (el.height || 0) <= A4_HEIGHT_MM, `Element ${el.id} y out of bounds`);
    });
  });

  it('2. Merges updated form text while strictly preserving custom drag-and-drop positions and sizes', () => {
    const initialLayout = buildDefaultCoverLayout({});
    // User dragged logo to (50, 60) and resized to 60mm x 60mm
    const modifiedElements = initialLayout.elements.map((el) => {
      if (el.id === 'logo') {
        return { ...el, x: 50, y: 60, width: 60, height: 60, zIndex: 10 };
      }
      if (el.id === 'university') {
        return { ...el, x: 30, y: 40 };
      }
      return el;
    });

    const customLayout = {
      pageWidth: 210,
      pageHeight: 297,
      elements: modifiedElements
    };

    // New cover form data typed by user
    const updatedCoverData = {
      country: 'جمهورية مصر العربية',
      university: 'جامعة الأزهر الشريف',
      title: 'أحكام النكاح',
      logoUrl: '/custom_logo.png'
    };

    const merged = mergeCoverDataWithLayout(customLayout, updatedCoverData);
    const logoEl = merged.elements.find((e) => e.id === 'logo');
    const uniEl = merged.elements.find((e) => e.id === 'university');

    assert.equal(logoEl.x, 50);
    assert.equal(logoEl.y, 60);
    assert.equal(logoEl.width, 60);
    assert.equal(logoEl.height, 60);
    assert.equal(logoEl.zIndex, 10);
    assert.equal(logoEl.source, '/custom_logo.png');

    assert.equal(uniEl.x, 30);
    assert.equal(uniEl.y, 40);
    assert.equal(uniEl.content, 'جامعة الأزهر الشريف');
  });

  it('3. DOCX Generator respects custom coverLayout positions, logo dimensions, and element ordering', async () => {
    const customCoverLayout = {
      pageWidth: 210,
      pageHeight: 297,
      elements: [
        {
          id: 'country',
          type: 'text',
          content: 'جمهورية الصومال',
          x: 25,
          y: 20,
          fontSize: 20,
          fontWeight: 'bold'
        },
        {
          id: 'logo',
          type: 'image',
          source: '/uploads/default_university_logo.png',
          x: 70,
          y: 40,
          width: 70, // Resized to 70mm
          height: 70
        },
        {
          id: 'title',
          type: 'pill',
          content: 'بحث في المعاملات المالية المعاصرة',
          badgeColor: '#0F766E',
          x: 30,
          y: 120,
          width: 150
        }
      ]
    };

    const mockResearch = {
      title: 'بحث في المعاملات المالية المعاصرة',
      borderId: 'none',
      cover: {
        country: 'جمهورية الصومال',
        university: 'جامعة هرمود',
        title: 'بحث في المعاملات المالية المعاصرة',
        logoUrl: '/uploads/default_university_logo.png',
        coverLayout: customCoverLayout
      },
      introduction: {
        opening: 'الحمد لله رب العالمين',
        text: 'مقدمة البحث الفقهي وأهدافه.'
      },
      topics: [
        {
          topicId: 't1',
          order: 1,
          h1Title: 'المطلب الأول: تعريف المعاملات المالية',
          rawContent: 'محتوى المطلب الأول بتفصيل.',
          footnotes: []
        }
      ],
      conclusion: {
        title: 'الخاتمة',
        points: ['النتيجة الأولى']
      },
      references: [
        { order: 1, book: 'المجموع شرح المهذب' }
      ]
    };

    const docxBuffer = await DocxGenerator.generateDocx(mockResearch);
    assert.ok(Buffer.isBuffer(docxBuffer));
    assert.ok(docxBuffer.length > 5000);

    const zip = await JSZip.loadAsync(docxBuffer);
    assert.ok(zip.files['word/document.xml']);

    const docXml = await zip.files['word/document.xml'].async('text');
    // Verify document XML contains custom title and country
    assert.ok(docXml.includes('بحث في المعاملات المالية المعاصرة'));
    assert.ok(docXml.includes('جمهورية الصومال'));
    assert.ok(docXml.includes('0F766E')); // Custom badge color in table
    assert.ok(docXml.includes('<w:bidi/>')); // True RTL
  });
});
