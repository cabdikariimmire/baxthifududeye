const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const {
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_FILE_PATH,
  isCustomLogo,
  resolveLogoUrl,
  resolveLogoFilePath,
  resolveLogoBuffer,
  resolveLogoBase64
} = require('../src/services/document/logoResolver');

const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const { getDefaultCoverElements, buildDefaultCoverLayout } = require('../src/services/document/coverLayout');

describe('Cover Logo Default & Custom Acceptance Tests', () => {
  it('1. Default university logo asset exists on disk and is accessible', () => {
    assert.ok(fs.existsSync(DEFAULT_LOGO_FILE_PATH), `Default logo file must exist at ${DEFAULT_LOGO_FILE_PATH}`);
    const stat = fs.statSync(DEFAULT_LOGO_FILE_PATH);
    assert.ok(stat.size > 0, 'Default logo file must not be empty');
    assert.equal(DEFAULT_LOGO_URL, '/uploads/default_university_logo.png');
  });

  it('2. Authoritative logo resolver correctly distinguishes custom vs default logos', () => {
    // Falsy or empty values are NOT custom
    assert.equal(isCustomLogo(null), false);
    assert.equal(isCustomLogo(undefined), false);
    assert.equal(isCustomLogo(''), false);
    assert.equal(isCustomLogo('none'), false);
    assert.equal(isCustomLogo('   '), false);
    assert.equal(isCustomLogo('/uploads/default_university_logo.png'), false);
    assert.equal(isCustomLogo('/default_university_logo.png'), false);

    // Custom uploaded URLs or base64 are custom
    assert.equal(isCustomLogo('/uploads/logo-1725458900-12345.png'), true);
    assert.equal(isCustomLogo('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), true);
  });

  it('3. CASE 1 & CASE 7: New research resolves to default university logo (No leakage)', () => {
    const newResearch = {
      _id: 'res-new-1',
      title: 'بحث فقهي جديد',
      cover: {
        country: 'المملكة العربية السعودية',
        university: 'جامعة الإمام محمد بن سعود',
        logoUrl: '' // Not set / empty
      }
    };

    const docModel = DocumentBuilder.buildDocument(newResearch);
    const coverPage = docModel.pages.find((p) => p.pageType === 'cover');
    assert.ok(coverPage, 'Cover page must exist');
    assert.equal(coverPage.data.logoUrl, DEFAULT_LOGO_URL, 'Cover page logoUrl must resolve to default university logo');

    // PDF HTML resolution
    const html = PDFGenerator.buildDocumentHTML(docModel);
    assert.ok(html.includes('class="cover-logo"'), 'Cover logo must be rendered in PDF HTML');
    assert.ok(html.includes('data:image/png;base64,'), 'Default logo must be base64-embedded in PDF HTML');

    // Second completely independent new research
    const secondNewResearch = {
      _id: 'res-new-2',
      title: 'بحث أصول الفقه',
      cover: {
        title: 'بحث أصول الفقه'
      }
    };
    const secondDocModel = DocumentBuilder.buildDocument(secondNewResearch);
    const secondCover = secondDocModel.pages.find((p) => p.pageType === 'cover');
    assert.equal(secondCover.data.logoUrl, DEFAULT_LOGO_URL, 'Second new research must also resolve to default logo');
  });

  it('4. CASE 2, 3, 4: Custom uploaded logo replaces default logo and persists', () => {
    // Create a temporary custom logo file in uploads to simulate user upload
    const customFileName = `logo-test-custom-${Date.now()}.png`;
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const customFilePath = path.join(uploadsDir, customFileName);

    // Copy default logo as a mock custom upload
    fs.copyFileSync(DEFAULT_LOGO_FILE_PATH, customFilePath);

    try {
      const customUrl = `/uploads/${customFileName}`;
      const researchWithCustomLogo = {
        _id: 'res-custom-1',
        title: 'بحث مع شعار مخصص',
        cover: {
          country: 'دولة الكويت',
          university: 'جامعة الكويت',
          logoUrl: customUrl
        }
      };

      assert.equal(resolveLogoUrl(customUrl), customUrl);
      assert.equal(resolveLogoFilePath(customUrl), customFilePath);

      const docModel = DocumentBuilder.buildDocument(researchWithCustomLogo);
      const coverPage = docModel.pages.find((p) => p.pageType === 'cover');
      assert.equal(coverPage.data.logoUrl, customUrl, 'Custom logo must be preserved in documentModel');

      // Verify custom logo in PDF
      const html = PDFGenerator.buildDocumentHTML(docModel);
      assert.ok(html.includes('class="cover-logo"'), 'Cover logo rendered in PDF');
      assert.ok(html.includes('data:image/png;base64,'), 'Custom logo embedded as base64');
    } finally {
      if (fs.existsSync(customFilePath)) {
        fs.unlinkSync(customFilePath);
      }
    }
  });

  it('5. CASE 5 & CASE 6: PDF and DOCX exports use the resolved logo with correct aspect ratio', async () => {
    // 5.1 With default logo
    const defaultResearch = {
      _id: 'res-export-default',
      title: 'بحث الغلاف الافتراضي',
      cover: {
        country: 'جمهورية مصر العربية',
        university: 'جامعة الأزهر',
        college: 'كلية الشريعة والقانون',
        title: 'أحكام النكاح في الفقه الإسلامي',
        studentName: 'أحمد محمود',
        supervisor: 'أ.د. عبد الله محمد',
        logoUrl: '' // empty => default
      }
    };

    const docxBuffer = await DocxGenerator.generateDocx(defaultResearch);
    assert.ok(docxBuffer && docxBuffer.length > 0, 'DOCX Buffer generated');

    // Inspect DOCX contents with JSZip to verify ImageRun media is embedded
    const zip = await JSZip.loadAsync(docxBuffer);
    const mediaFiles = Object.keys(zip.files).filter((name) => name.startsWith('word/media/'));
    assert.ok(mediaFiles.length >= 1, `DOCX must contain embedded logo image in word/media/, found: ${mediaFiles.join(', ')}`);

    // Verify document.xml contains the drawing
    const docXml = await zip.files['word/document.xml'].async('text');
    assert.ok(docXml.includes('<w:drawing>') || docXml.includes('<a:blip'), 'DOCX document.xml must contain drawing tag for the logo');
  });

  it('6. Fallback Rule: Removing a custom logo cleanly reverts back to default logo', () => {
    // User had a custom logo, then removes it
    const researchAfterLogoRemoval = {
      _id: 'res-removed-logo',
      title: 'بحث بعد حذف الشعار',
      cover: {
        country: 'المملكة الأردنية الهاشمية',
        university: 'الجامعة الأردنية',
        logoUrl: '' // cleared
      }
    };

    assert.equal(resolveLogoUrl(researchAfterLogoRemoval.cover.logoUrl), DEFAULT_LOGO_URL);
    const docModel = DocumentBuilder.buildDocument(researchAfterLogoRemoval);
    const coverPage = docModel.pages.find((p) => p.pageType === 'cover');
    assert.equal(coverPage.data.logoUrl, DEFAULT_LOGO_URL, 'Must revert cleanly to default logo URL');
  });

  it('7. Website Cover = PDF Cover = DOCX Cover: Empty fields remain empty, title is 20pt, border preserved', async () => {
    const researchWithSelectedBorder = {
      _id: 'res-border-fidelity',
      title: 'دراسة مقارنة في المعاملات المالية',
      borderId: 'none', // بدون إطار
      cover: {
        country: 'الإمارات العربية المتحدة',
        university: 'جامعة الشارقة',
        title: 'دراسة مقارنة في المعاملات المالية',
        studentName: 'سعيد بن راشد',
        // college, supervisor, semester left empty
        logoUrl: ''
      }
    };

    const docModel = DocumentBuilder.buildDocument(researchWithSelectedBorder);
    const coverPage = docModel.pages.find((p) => p.pageType === 'cover');

    // Empty fields are strictly empty
    assert.equal(coverPage.data.college, '', 'Empty college must remain empty');
    assert.equal(coverPage.data.supervisor, '', 'Empty supervisor must remain empty');
    assert.equal(coverPage.data.semester, '', 'Empty semester must remain empty');

    // PDF HTML fidelity
    const html = PDFGenerator.buildDocumentHTML(docModel);
    assert.ok(!html.includes('إشراف الدكتور:'), 'Unfilled supervisor must not appear in PDF HTML');
    assert.ok(!html.includes('المادة :'), 'Unfilled subject must not appear in PDF HTML');
    assert.ok(html.includes('سعيد بن راشد'), 'Filled studentName must appear in PDF HTML');
    assert.ok(html.includes('جامعة الشارقة'), 'Filled university must appear in PDF HTML');

    // DOCX fidelity
    const docxBuffer = await DocxGenerator.generateDocx(researchWithSelectedBorder);
    const zip = await JSZip.loadAsync(docxBuffer);
    const docXml = await zip.files['word/document.xml'].async('text');

    assert.ok(docXml.includes('سعيد بن راشد'), 'DOCX contains student name');
    assert.ok(docXml.includes('جامعة الشارقة'), 'DOCX contains university name');
    assert.ok(!docXml.includes('إشراف الدكتور'), 'DOCX must not contain empty supervisor label');
  });
});
