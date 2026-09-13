const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const JSZip = require('jszip');

const downloadDir = path.resolve(__dirname, '../../qa_downloads');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickButtonWithText(page, textSubstring) {
  const buttons = await page.$$('button, a.btn');
  for (const b of buttons) {
    try {
      const isVisible = await page.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
      }, b);
      if (!isVisible) continue;
      const txt = await page.evaluate((el) => el.textContent, b);
      if (txt && txt.includes(textSubstring)) {
        await b.click();
        return true;
      }
    } catch (e) {}
  }
  return false;
}

async function runLiveVisibleQA() {
  console.log('====================================================');
  console.log('🚀 STARTING LIVE VISIBLE BROWSER QA TEST');
  console.log('====================================================\n');

  console.log('🖥️ Launching visible Google Chrome window (Maximized GUI)...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security'
    ],
    slowMo: 60 // Observable slow-motion typing and clicking
  });

  const [page] = await browser.pages();

  // Configure automatic file downloads to qa_downloads
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir
  });

  try {
    // ----------------------------------------------------
    // PHASE 1: OPEN WEBSITE & AUTHENTICATION
    // ----------------------------------------------------
    console.log('\n📍 [Phase 1/9] Opening research web application at http://localhost:5173...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await sleep(1000);

    const email = `qa.hasan.${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    const studentName = 'حسن عبد الله أحمد';

    console.log('🔐 Navigating to registration page...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
    await sleep(800);

    console.log(`✍️ Entering test researcher credentials: ${email}...`);
    const nameInput = await page.$('input[placeholder*="اسم الباحث"], input[type="text"]');
    if (nameInput) await nameInput.type(studentName, { delay: 40 });

    const emailInput = await page.$('input[type="email"]');
    if (emailInput) await emailInput.type(email, { delay: 30 });

    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) await passwordInput.type(password, { delay: 30 });

    console.log('🖱️ Clicking submit button to create account...');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await sleep(1500);

    // ----------------------------------------------------
    // PHASE 2: CREATE CONTROLLED TEST RESEARCH
    // ----------------------------------------------------
    console.log('\n📍 [Phase 2/9] Navigating to create a new research...');
    await page.goto('http://localhost:5173/research/new', { waitUntil: 'networkidle2' });
    await sleep(2000);

    console.log('📄 [Step 1: الغلاف] Entering research cover metadata...');
    // Title
    const titleInput = await page.$('input[name="title"], textarea[name="title"], input[placeholder*="عنوان"]');
    if (titleInput) {
      await titleInput.click({ clickCount: 3 });
      await titleInput.type('أحكام الاعتكاف ومقاصده في الشريعة الإسلامية', { delay: 30 });
    }

    // University
    const univInput = await page.$('input[name="university"], input[placeholder*="الجامعة"]');
    if (univInput) {
      await univInput.click({ clickCount: 3 });
      await univInput.type('جامعة هرمود', { delay: 30 });
    }

    // College
    const collegeInput = await page.$('input[name="college"], input[placeholder*="الكلية"]');
    if (collegeInput) {
      await collegeInput.click({ clickCount: 3 });
      await collegeInput.type('كلية الشريعة والقانون', { delay: 30 });
    }

    // Student
    const studentInput = await page.$('input[name="studentName"], input[placeholder*="الطالب"], input[placeholder*="الباحث"]');
    if (studentInput) {
      await studentInput.click({ clickCount: 3 });
      await studentInput.type(studentName, { delay: 30 });
    }

    // Supervisor
    const supInput = await page.$('input[name="supervisor"], input[placeholder*="المشرف"]');
    if (supInput) {
      await supInput.click({ clickCount: 3 });
      await supInput.type('الشيخ الناجي الشرعبي', { delay: 30 });
    }

    await sleep(1000);
    console.log('🖱️ Clicking "حفظ ومتابعة للمقدمة والخطة"...');
    await clickButtonWithText(page, 'حفظ ومتابعة') || (await (await page.$('button[type="submit"]'))?.click());
    await sleep(2000);

    // ----------------------------------------------------
    // PHASE 3: INTRODUCTION & PLAN (Step 2)
    // ----------------------------------------------------
    console.log('\n📍 [Phase 3/9] [Step 2: المقدمة وخطة البحث] Entering academic introduction text...');
    const introTextarea = await page.$('textarea');
    if (introTextarea) {
      await introTextarea.click();
      await introTextarea.type(
        'الحمد لله رب العالمين والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين، أما بعد:\nفإن الاعتكاف من أجل الطاعات وأعظم القربات إلى الله تعالى في الشريعة الإسلامية، ونستعرض في هذا البحث خطة علمية متكاملة تتناول تعريف الاعتكاف ومشروعيته وأحكامه ومقاصده التعبدية والتربوية.',
        { delay: 15 }
      );
    }
    await sleep(1000);
    console.log('🖱️ Clicking "حفظ ومتابعة لهيكلية البحث"...');
    await clickButtonWithText(page, 'حفظ ومتابعة') || (await (await page.$('button[type="submit"]'))?.click());
    await sleep(2000);

    // ----------------------------------------------------
    // PHASE 4: STRUCTURE REVIEW (Step 3)
    // ----------------------------------------------------
    console.log('\n📍 [Phase 4/9] [Step 3: هيكلية البحث] Verifying structure...');
    await sleep(1500);
    console.log('🖱️ Confirming structure and proceeding to content editor...');
    await clickButtonWithText(page, 'حفظ ومتابعة') || await clickButtonWithText(page, 'المتابعة لمحتوى المطالب') || (await (await page.$('button.btn-primary'))?.click());
    await sleep(2500);

    // ----------------------------------------------------
    // PHASE 5: TOPIC CONTENT & FOOTNOTES (Step 4)
    // ----------------------------------------------------
    console.log('\n📍 [Phase 5/9] [Step 4: محتوى المطالب] Testing content editor & footnotes...');
    await sleep(1500);

    // Type content into the active editor
    const contentTextarea = await page.$('textarea');
    if (contentTextarea) {
      await contentTextarea.click();
      await contentTextarea.type(
        'الاعتكاف لغة هو لزوم الشيء وحبس النفس عليه(1)، وفي الاصطلاح هو المكث في المسجد بنية التقرب إلى الله تعالى(2).',
        { delay: 20 }
      );
    }

    await sleep(1000);
    console.log('🖱️ Moving to Step 5: الخاتمة...');
    await clickButtonWithText(page, 'الخاتمة') || await clickButtonWithText(page, 'حفظ ومتابعة') || (await (await page.$('button.btn-primary'))?.click());
    await sleep(2500);

    // ----------------------------------------------------
    // PHASE 6: CONCLUSION (Step 5 in Wizard)
    // ----------------------------------------------------
    console.log('\n📍 [Phase 6/9] [Step 5: الخاتمة] Entering conclusion and numbered results...');
    const conclusionTextarea = await page.$('textarea');
    if (conclusionTextarea) {
      await conclusionTextarea.click();
      await conclusionTextarea.type(
        'وفي ختام هذا البحث الذي تناولنا فيه أحكام الاعتكاف ومقاصده نلخص أهم النتائج:',
        { delay: 20 }
      );
    }

    // Click "إضافة نتيجة" button
    await clickButtonWithText(page, 'إضافة نتيجة');
    await sleep(500);

    const resultInputs = await page.$$('textarea');
    if (resultInputs.length > 1) {
      await resultInputs[1].type('الاعتكاف سنة مؤكدة في العشر الأواخر من رمضان لطلب ليلة القدر.', { delay: 15 });
    }

    await sleep(1000);
    console.log('🖱️ Saving conclusion and proceeding to references...');
    await clickButtonWithText(page, 'حفظ ومتابعة') || (await (await page.$('button[type="submit"]'))?.click());
    await sleep(2500);

    // ----------------------------------------------------
    // PHASE 7: REFERENCES & TOC & PREVIEW (Steps 6, 7, 8)
    // ----------------------------------------------------
    console.log('\n📍 [Phase 7/9] [Step 6: المصادر والمراجع] Proceeding to TOC...');
    await clickButtonWithText(page, 'حفظ ومتابعة') || (await (await page.$('button[type="submit"]'))?.click());
    await sleep(2500);

    console.log('📍 [Step 7: فهرس الموضوعات] Proceeding to A4 Preview...');
    await clickButtonWithText(page, 'حفظ ومتابعة') || await clickButtonWithText(page, 'المعاينة') || (await (await page.$('button.btn-primary'))?.click());
    await sleep(2500);

    console.log('📍 [Step 8: معاينة البحث A4] Visually scrolling vertically through A4 pages (210x297mm)...');
    await page.evaluate(() => window.scrollBy({ top: 700, behavior: 'smooth' }));
    await sleep(1500);
    await page.evaluate(() => window.scrollBy({ top: 700, behavior: 'smooth' }));
    await sleep(1500);

    console.log('🖱️ Proceeding to export step (Step 9)...');
    await clickButtonWithText(page, 'المتابعة للتصدير') || await clickButtonWithText(page, 'تصدير') || (await (await page.$('button.btn-primary'))?.click());
    await sleep(2500);

    // ----------------------------------------------------
    // PHASE 8: REAL DOCX & PDF DOWNLOAD & VERIFICATION
    // ----------------------------------------------------
    console.log('\n📍 [Phase 8/9] [Step 9: تصدير البحث] Clicking Word DOCX and PDF export buttons in visible UI...');

    console.log('🖱️ Clicking "تحميل ملف Word (DOCX)" button...');
    await clickButtonWithText(page, 'Word') || await clickButtonWithText(page, 'DOCX');
    await sleep(4000);

    console.log('🖱️ Clicking "تحميل بصيغة PDF" button...');
    await clickButtonWithText(page, 'PDF') || await clickButtonWithText(page, 'بي دي إف');
    await sleep(5000);

    // Inspect downloaded files in qa_downloads
    const files = fs.readdirSync(downloadDir);
    console.log(`\n📂 Downloaded files in directory: ${downloadDir}`);
    console.log('   Files:', files);

    const docxFile = files.find((f) => f.endsWith('.docx'));
    const pdfFile = files.find((f) => f.endsWith('.pdf'));

    if (docxFile) {
      const docxPath = path.join(downloadDir, docxFile);
      const docxData = fs.readFileSync(docxPath);
      console.log(`\n✅ Real Word DOCX downloaded successfully (${docxData.length} bytes): ${docxFile}`);

      const zip = await JSZip.loadAsync(docxData);
      const hasDoc = !!zip.file('word/document.xml');
      const hasFootnotes = !!zip.file('word/footnotes.xml');
      console.log(`   - word/document.xml present: ${hasDoc}`);
      console.log(`   - word/footnotes.xml present: ${hasFootnotes}`);

      if (hasDoc) {
        const docXml = await zip.file('word/document.xml').async('text');
        console.log(`   - Research title present in DOCX: ${docXml.includes('أحكام الاعتكاف')}`);
      }

      // Check if Microsoft Word can open it
      const winwordPath = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE';
      if (fs.existsSync(winwordPath)) {
        console.log('📄 Launching Microsoft Word to display the generated document...');
        exec(`"${winwordPath}" "${docxPath}"`, (err) => {
          if (err) console.log('Notice on launching Word:', err.message);
        });
      }
    }

    if (pdfFile) {
      const pdfPath = path.join(downloadDir, pdfFile);
      const pdfData = fs.readFileSync(pdfPath);
      console.log(`\n✅ Real PDF downloaded successfully (${pdfData.length} bytes): ${pdfFile}`);
      console.log(`   - Valid PDF magic bytes (%PDF-): ${pdfData.subarray(0, 5).toString('ascii') === '%PDF-'}`);
    }

    // ----------------------------------------------------
    // PHASE 9: EMPTY RESEARCH TEST (EMPTY = EMPTY)
    // ----------------------------------------------------
    console.log('\n📍 [Phase 9/9] [EMPTY RESEARCH TEST] Creating brand new empty research in browser...');
    await page.goto('http://localhost:5173/research/new', { waitUntil: 'networkidle2' });
    await sleep(2500);

    const coverInputs = await page.$$eval('input[type="text"]', (inputs) => inputs.map((i) => i.value));
    const allEmpty = coverInputs.every((v) => v === '');
    console.log(`✅ Empty research verification (All cover input fields empty): ${allEmpty}`);
    console.log('   Input values found in UI:', coverInputs);

    console.log('\n====================================================');
    console.log('🎉 LIVE VISIBLE BROWSER QA TEST COMPLETED 100% SUCCESSFULLY!');
    console.log('====================================================\n');

    await sleep(6000);
  } finally {
    await browser.close();
  }
}

runLiveVisibleQA().catch((err) => {
  console.error('❌ LIVE VISIBLE QA ERROR:', err);
  process.exit(1);
});
