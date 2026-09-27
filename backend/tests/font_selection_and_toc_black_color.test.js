const { test, describe } = require('node:test');
const assert = require('node:assert');
const puppeteer = require('puppeteer');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const {
  RESEARCH_FONTS,
  ALLOWED_FONT_IDS,
  DEFAULT_FONT_ID,
  isValidFontId,
  normalizeFontId,
  getFontConfig
} = require('../src/config/researchFonts');

const sampleResearch = {
  title: 'أحكام النوازل في الفقه الإسلامي المعاصر',
  borderId: 'none',
  cover: {
    country: 'المملكة العربية السعودية',
    university: 'جامعة الإمام محمد بن سعود الإسلامية',
    college: 'كلية الشريعة',
    subject: 'الفقه المقارن',
    title: 'أحكام النوازل في الفقه الإسلامي المعاصر',
    studentName: 'عبد الله بن محمد الأحمدي',
    level: 'الدراسات العليا - مرحلة الماجستير',
    supervisor: 'الأستاذ الدكتور أحمد العسيري',
    semester: 'الفصل الدراسي الأول',
    academicYear: '1446 هـ',
    gregorianYear: '2024 م',
    badgeColor: '#1e3a8a'
  },
  introduction: {
    opening: 'الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين سيدنا محمد وعلى آله وصحبه أجمعين.',
    text: 'تعد دراسة النوازل الفقهية من أهم المباحث التي تبرز مرونة الشريعة الإسلامية وقدرتها على استيعاب المستجدات في كل زمان ومكان. وقد جاء هذا البحث ليوضح المناهج الأصولية المتبعة في تخريج الفروع على الأصول.'
  },
  topics: [
    {
      topicId: 'topic-1',
      h1Title: 'المطلب الأول: تعريف النوازل وأهميتها الفقهية',
      blocks: [
        { type: 'h1', text: 'المطلب الأول: تعريف النوازل وأهميتها الفقهية' },
        {
          type: 'paragraph',
          text: 'النازلة في اللغة مأخوذة من النزول وهو الهبوط والحلول(1). وفي الاصطلاح الفقهي هي المسألة الحادثة التي لم يرد فيها نص صريح وتتطلب اجتهاداً معاصراً لاستنباط حكمها الشرعي.'
        },
        { type: 'h2', text: 'الفرع الأول: المفهوم اللغوي والاصطلاحي' },
        {
          type: 'paragraph',
          text: 'يتناول هذا الفرع التأصيل اللغوي لمفردة النوازل ومقارنتها بالواقعات والفتاوى الفقهية في المذاهب الأربعة(2).'
        }
      ],
      footnotes: [
        { footnoteId: 'fn-1', number: 1, text: 'ابن منظور، لسان العرب، دار صادر، ج11، ص654.' },
        { footnoteId: 'fn-2', number: 2, text: 'النووي، المجموع شرح المهذب، مطبعة المنيرية، ج1، ص45.' }
      ]
    }
  ],
  conclusion: {
    title: 'الخاتمة',
    text: 'وفي ختام هذا البحث المتواضع نحمد الله تعالى على ما يسر وأعان، وقد توصلت الدراسة إلى جملة من النتائج الهامة:',
    points: [
      'أن النوازل الفقهية تمثل روح التجديد في الفقه الإسلامي المنضبط بأصول الشريعة.',
      'ضرورة إعمال الاجتهاد الجماعي عبر المجامع الفقهية المعتمدة لضمان سلامة الفتوى.'
    ]
  },
  references: [
    {
      order: 1,
      book: 'لسان العرب',
      displayText: 'ابن منظور: لسان العرب، دار صادر، بيروت.'
    },
    {
      order: 2,
      book: 'المجموع شرح المهذب',
      displayText: 'النووي: المجموع شرح المهذب، مطبعة المنيرية، القاهرة.'
    }
  ]
};

describe('Academic Research Font Selection & TOC Page Number Verification', () => {

  // =========================================================================
  // 1. Centralized Font Configuration Tests
  // =========================================================================
  test('1. Centralized configuration defines exactly 4 canonical research fonts', () => {
    assert.strictEqual(RESEARCH_FONTS.length, 4, 'Must have exactly 4 defined fonts');
    
    const ids = RESEARCH_FONTS.map(f => f.id);
    assert.ok(ids.includes('default'), 'Must contain default font (Amiri)');
    assert.ok(ids.includes('times-new-roman'), 'Must contain Times New Roman');
    assert.ok(ids.includes('arial'), 'Must contain Arial');
    assert.ok(ids.includes('simplified-arabic'), 'Must contain Simplified Arabic');

    // Default font check
    const defaultFont = RESEARCH_FONTS.find(f => f.id === 'default');
    assert.strictEqual(defaultFont.isDefault, true, 'Default font must have isDefault = true');
    assert.ok(defaultFont.family.includes('Amiri'), 'Default font must be Amiri');
    assert.strictEqual(DEFAULT_FONT_ID, 'default');
  });

  test('2. Font safety & security: rejects unknown fonts and prevents arbitrary CSS injection', () => {
    assert.strictEqual(isValidFontId('default'), true);
    assert.strictEqual(isValidFontId('times-new-roman'), true);
    assert.strictEqual(isValidFontId('arial'), true);
    assert.strictEqual(isValidFontId('simplified-arabic'), true);

    // Malicious or arbitrary inputs
    assert.strictEqual(isValidFontId('Comic Sans; color: red;'), false);
    assert.strictEqual(isValidFontId('<script>alert(1)</script>'), false);
    assert.strictEqual(isValidFontId('unknown-font'), false);

    // Safe fallback to default
    const safeFallback1 = getFontConfig('unknown-font');
    assert.strictEqual(safeFallback1.id, 'default');
    assert.ok(safeFallback1.cssValue.includes('Amiri'));

    const safeFallback2 = getFontConfig('"; background: red; "');
    assert.strictEqual(safeFallback2.id, 'default');
  });

  // =========================================================================
  // 2. Default Behavior & Backward Compatibility Tests
  // =========================================================================
  test('3. Document model backward compatibility: documents with no font default to Amiri', () => {
    const docModel = DocumentBuilder.buildDocument({ ...sampleResearch, fontFamily: undefined });
    assert.strictEqual(docModel.fontFamily, 'default');
    assert.ok(docModel.fontConfig.cssValue.includes('Amiri'));

    const docModelNull = DocumentBuilder.buildDocument({ ...sampleResearch, fontFamily: null });
    assert.strictEqual(docModelNull.fontFamily, 'default');
  });

  // =========================================================================
  // 3. TOC Page Number Black Color Tests
  // =========================================================================
  test('4. Table of Contents page numbers are rendered in BLACK (#000000) in PDF generator', async () => {
    const docModel = DocumentBuilder.buildDocument(sampleResearch);
    const html = PDFGenerator.buildDocumentHTML(docModel);

    // Verify .entry-page CSS rule is black and NOT teal
    assert.ok(
      html.includes('.entry-page {') && html.includes('color: #000000 !important;'),
      '.entry-page must have color: #000000 !important;'
    );
    assert.ok(
      !html.includes('.entry-page {\n      font-weight: bold;\n      color: #0f766e;'),
      '.entry-page must not have teal color #0f766e'
    );

    // Verify TOC structure elements are preserved
    assert.ok(html.includes('.entry-title'), 'TOC title class preserved');
    assert.ok(html.includes('.entry-leader'), 'TOC leader dots preserved');
    assert.ok(html.includes('toc-header-bar'), 'TOC header preserved');

    // Launch headless Puppeteer to check computed CSS color in real browser engine
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      // Check computed color of .entry-page elements
      const entryPageColors = await page.evaluate(() => {
        const els = document.querySelectorAll('.entry-page');
        return Array.from(els).map(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            text: el.textContent.trim()
          };
        });
      });

      assert.ok(entryPageColors.length > 0, 'Must have at least one TOC entry');
      entryPageColors.forEach(item => {
        // rgb(0, 0, 0) is pure black
        assert.strictEqual(
          item.color,
          'rgb(0, 0, 0)',
          `TOC page number "${item.text}" computed color must be pure black rgb(0, 0, 0), was ${item.color}`
        );
      });

      // Generate actual PDF buffer
      const pdfBuffer = await page.pdf({ format: 'A4' });
      assert.ok(pdfBuffer && pdfBuffer.length > 1000, 'PDF buffer must be valid');
    } finally {
      await browser.close();
    }
  });

  // =========================================================================
  // 4. Testing All 4 Fonts: Cover Unchanged, Content Starts from المقدمة والخطة
  // =========================================================================

  test('5. Test 1 (Default Font): Cover unchanged, research content uses Amiri', async () => {
    const research = { ...sampleResearch, fontFamily: 'default' };
    const docModel = DocumentBuilder.buildDocument(research);
    const html = PDFGenerator.buildDocumentHTML(docModel);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const styles = await page.evaluate(() => {
        const coverEl = document.querySelector('.pdf-cover-element span');
        const pageBody = document.querySelector('.page-body');
        const mainHeading = document.querySelector('.topic-h1');
        const bodyText = document.querySelector('.topic-p');

        return {
          coverFont: coverEl ? window.getComputedStyle(coverEl).fontFamily : null,
          pageBodyFont: pageBody ? window.getComputedStyle(pageBody).fontFamily : null,
          headingFont: mainHeading ? window.getComputedStyle(mainHeading).fontFamily : null,
          bodyFont: bodyText ? window.getComputedStyle(bodyText).fontFamily : null
        };
      });

      // Cover uses Amiri
      assert.ok(styles.coverFont.includes('Amiri'), 'Cover must use Amiri font');
      // Content uses Amiri
      assert.ok(styles.pageBodyFont.includes('Amiri'), 'page-body must use Amiri');
      assert.ok(styles.headingFont.includes('Amiri'), 'heading must use Amiri');

      const pdf = await PDFGenerator.generatePDF(research);
      assert.ok(pdf && pdf.length > 5000, 'PDF generated successfully');
    } finally {
      await browser.close();
    }
  });

  test('6. Test 2 (Times New Roman): Cover UNCHANGED (Amiri), research content uses Times New Roman', async () => {
    const research = { ...sampleResearch, fontFamily: 'times-new-roman' };
    const docModel = DocumentBuilder.buildDocument(research);
    const html = PDFGenerator.buildDocumentHTML(docModel);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const styles = await page.evaluate(() => {
        const coverEl = document.querySelector('.pdf-cover-element span');
        const pageBody = document.querySelector('.page-body');
        const mainHeading = document.querySelector('.topic-h1');
        const bodyText = document.querySelector('.topic-p');
        const tocRow = document.querySelector('.toc-row');

        return {
          coverFont: coverEl ? window.getComputedStyle(coverEl).fontFamily : null,
          pageBodyFont: pageBody ? window.getComputedStyle(pageBody).fontFamily : null,
          headingFont: mainHeading ? window.getComputedStyle(mainHeading).fontFamily : null,
          bodyFont: bodyText ? window.getComputedStyle(bodyText).fontFamily : null,
          tocFont: tocRow ? window.getComputedStyle(tocRow).fontFamily : null
        };
      });

      // Cover remains UNCHANGED (Amiri)
      assert.ok(styles.coverFont.includes('Amiri'), `Cover font must remain Amiri, was: ${styles.coverFont}`);
      
      // Content uses Times New Roman
      assert.ok(
        styles.pageBodyFont.includes('Times New Roman') || styles.pageBodyFont.includes('Times'),
        `page-body must use Times New Roman, was: ${styles.pageBodyFont}`
      );
      assert.ok(
        styles.headingFont.includes('Times New Roman') || styles.headingFont.includes('Times'),
        `heading must use Times New Roman, was: ${styles.headingFont}`
      );
      assert.ok(
        styles.bodyFont.includes('Times New Roman') || styles.bodyFont.includes('Times'),
        `body must use Times New Roman, was: ${styles.bodyFont}`
      );
      assert.ok(
        styles.tocFont.includes('Times New Roman') || styles.tocFont.includes('Times'),
        `TOC must use Times New Roman, was: ${styles.tocFont}`
      );

      const pdf = await PDFGenerator.generatePDF(research);
      assert.ok(pdf && pdf.length > 5000, 'PDF generated successfully with Times New Roman');
    } finally {
      await browser.close();
    }
  });

  test('7. Test 3 (Arial): Cover UNCHANGED (Amiri), research content uses Arial', async () => {
    const research = { ...sampleResearch, fontFamily: 'arial' };
    const docModel = DocumentBuilder.buildDocument(research);
    const html = PDFGenerator.buildDocumentHTML(docModel);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const styles = await page.evaluate(() => {
        const coverEl = document.querySelector('.pdf-cover-element span');
        const pageBody = document.querySelector('.page-body');
        const mainHeading = document.querySelector('.topic-h1');
        const bodyText = document.querySelector('.topic-p');

        return {
          coverFont: coverEl ? window.getComputedStyle(coverEl).fontFamily : null,
          pageBodyFont: pageBody ? window.getComputedStyle(pageBody).fontFamily : null,
          headingFont: mainHeading ? window.getComputedStyle(mainHeading).fontFamily : null,
          bodyFont: bodyText ? window.getComputedStyle(bodyText).fontFamily : null
        };
      });

      // Cover remains UNCHANGED (Amiri)
      assert.ok(styles.coverFont.includes('Amiri'), `Cover font must remain Amiri, was: ${styles.coverFont}`);

      // Content uses Arial
      assert.ok(styles.pageBodyFont.includes('Arial'), `page-body must use Arial, was: ${styles.pageBodyFont}`);
      assert.ok(styles.headingFont.includes('Arial'), `heading must use Arial, was: ${styles.headingFont}`);
      assert.ok(styles.bodyFont.includes('Arial'), `body must use Arial, was: ${styles.bodyFont}`);

      const pdf = await PDFGenerator.generatePDF(research);
      assert.ok(pdf && pdf.length > 5000, 'PDF generated successfully with Arial');
    } finally {
      await browser.close();
    }
  });

  test('8. Test 4 (Simplified Arabic): Cover UNCHANGED (Amiri), research content uses Simplified Arabic', async () => {
    const research = { ...sampleResearch, fontFamily: 'simplified-arabic' };
    const docModel = DocumentBuilder.buildDocument(research);
    const html = PDFGenerator.buildDocumentHTML(docModel);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const styles = await page.evaluate(() => {
        const coverEl = document.querySelector('.pdf-cover-element span');
        const pageBody = document.querySelector('.page-body');
        const mainHeading = document.querySelector('.topic-h1');
        const bodyText = document.querySelector('.topic-p');

        return {
          coverFont: coverEl ? window.getComputedStyle(coverEl).fontFamily : null,
          pageBodyFont: pageBody ? window.getComputedStyle(pageBody).fontFamily : null,
          headingFont: mainHeading ? window.getComputedStyle(mainHeading).fontFamily : null,
          bodyFont: bodyText ? window.getComputedStyle(bodyText).fontFamily : null
        };
      });

      // Cover remains UNCHANGED (Amiri)
      assert.ok(styles.coverFont.includes('Amiri'), `Cover font must remain Amiri, was: ${styles.coverFont}`);

      // Content uses Simplified Arabic
      assert.ok(
        styles.pageBodyFont.includes('Simplified Arabic') || styles.pageBodyFont.includes('Traditional Arabic') || styles.pageBodyFont.includes('Tahoma'),
        `page-body must use Simplified Arabic, was: ${styles.pageBodyFont}`
      );
      assert.ok(
        styles.headingFont.includes('Simplified Arabic') || styles.headingFont.includes('Traditional Arabic') || styles.headingFont.includes('Tahoma'),
        `heading must use Simplified Arabic, was: ${styles.headingFont}`
      );
      assert.ok(
        styles.bodyFont.includes('Simplified Arabic') || styles.bodyFont.includes('Traditional Arabic') || styles.bodyFont.includes('Tahoma'),
        `body must use Simplified Arabic, was: ${styles.bodyFont}`
      );

      const pdf = await PDFGenerator.generatePDF(research);
      assert.ok(pdf && pdf.length > 5000, 'PDF generated successfully with Simplified Arabic');
    } finally {
      await browser.close();
    }
  });

});
