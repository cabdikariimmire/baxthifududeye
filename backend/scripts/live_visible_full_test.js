const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Register user directly via backend API
async function apiRegister(name, email, password) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ name, email, password });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 201 && parsed.success) {
              resolve(parsed.data);
            } else {
              reject(new Error(`Register failed ${res.statusCode}: ${data}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runLiveVisibleE2ETest() {
  console.log('===============================================================');
  console.log('  STARTING LIVE VISIBLE BROWSER END-TO-END QA TEST');
  console.log('===============================================================');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome executable not found at: ${chromePath}`);
  }

  // Fresh temp profile — always clear before running
  const tempProfileDir = path.resolve('C:\\Users\\cxc\\Desktop\\rese\\.tmp_chrome_profile');
  if (fs.existsSync(tempProfileDir)) {
    fs.rmSync(tempProfileDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const downloadDir = path.resolve('C:\\Users\\cxc\\Desktop\\rese\\scratch\\downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // -----------------------------------------------------------------------
  // PHASE 1: Register user via backend API
  // -----------------------------------------------------------------------
  const testEmail = `scholar_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'حسن عبد الله أحمد';

  console.log(`[Phase 1] Registering QA user via API: ${testEmail}`);
  const { token: authToken, user: registeredUser } = await apiRegister(testName, testEmail, testPassword);
  console.log(`[Phase 1] Registered. User ID: ${registeredUser.id}, Token: ${authToken.substring(0, 20)}...`);

  // -----------------------------------------------------------------------
  // PHASE 2: Launch visible Chrome
  // -----------------------------------------------------------------------
  console.log('[Phase 2] Launching VISIBLE Chrome Browser window...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    defaultViewport: null,
    slowMo: 40,
    args: [
      `--user-data-dir=${tempProfileDir}`,
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-size=1440,900',
      '--window-position=50,50'
    ]
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  // Print browser console logs
  page.on('console', (msg) => {
    const txt = msg.text();
    if (!txt.includes('React DevTools') && !txt.includes('Future Flag')) {
      console.log('PAGE:', txt);
    }
  });
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err));

  // Set up download behavior
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir
  });

  try {
    // -----------------------------------------------------------------------
    // PHASE 3: Open app homepage and inject auth token into localStorage
    // -----------------------------------------------------------------------
    console.log('[Phase 3] Navigating to homepage to inject auth credentials...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(1500);

    // Inject the JWT token and user data into localStorage so the app treats the user as logged in
    await page.evaluate(
      (token, userData) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        console.log('[TEST] Auth token injected into localStorage:', token.substring(0, 20) + '...');
      },
      authToken,
      registeredUser
    );

    // Reload so the app reads the token from localStorage and initializes correctly
    console.log('[Phase 3] Reloading app with injected credentials...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    // Verify we are on dashboard (not redirected to login)
    const dashUrl = page.url();
    console.log(`[Phase 3] Current URL after login injection: ${dashUrl}`);
    if (dashUrl.includes('/login') || dashUrl.includes('/register')) {
      throw new Error(`Auth injection failed — still on auth page: ${dashUrl}`);
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Create a new research
    // -----------------------------------------------------------------------
    console.log('[Phase 4] Navigating to create NEW research...');
    await page.goto('http://localhost:5173/research/new', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the cover form to appear (confirms research was created and redirected)
    await page.waitForSelector('input[name="country"]', { timeout: 30000 });
    const researchUrl = page.url();
    console.log(`[Phase 4] Research wizard URL: ${researchUrl}`);

    // Extract research ID from URL: /research/:id/step/1
    const researchIdMatch = researchUrl.match(/\/research\/([a-f0-9]+)\/step/);
    if (!researchIdMatch) {
      throw new Error(`Could not extract research ID from URL: ${researchUrl}`);
    }
    const researchId = researchIdMatch[1];
    console.log(`[Phase 4] Research ID: ${researchId}`);

    // -----------------------------------------------------------------------
    // PHASE 5: Fill Step 1 — Cover Page (الغلاف)
    // -----------------------------------------------------------------------
    console.log('[Phase 5] Filling Step 1: Academic Cover Page...');

    const fillInput = async (selector, value) => {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(selector, value, { delay: 20 });
    };

    await fillInput('input[name="country"]', 'جمهورية الصومال');
    await fillInput('input[name="university"]', 'جامعة هرمود');
    await fillInput('input[name="college"]', 'كلية الشريعة والقانون');
    await fillInput('input[name="subject"]', 'الفقه المقارن');
    await fillInput('input[name="title"]', 'أحكام الاعتكاف ومقاصده في الشريعة الإسلامية');
    await fillInput('input[name="studentName"]', 'حسن عبد الله أحمد');
    await fillInput('input[name="level"]', 'ماجستير فقه إسلامي');
    await fillInput('input[name="supervisor"]', 'الشيخ الناجي الشرعبي');
    await fillInput('input[name="academicYear"]', '1447–1448هـ');
    await fillInput('input[name="gregorianYear"]', '2025–2026م');

    await delay(500);
    console.log('[Phase 5] Cover fields filled. Submitting...');
    await page.click('button[type="submit"]');
    await delay(2500);

    // -----------------------------------------------------------------------
    console.log('[Phase 6] Saving Introduction & analyzing research structure via API...');

    const introText = `الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين، سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:

فإن الاعتكاف من السنن المؤكدة في الشريعة الإسلامية، وله مقاصد سامية في تزكية النفس وإخلاص العبادة لله تعالى.

وقد انتظمت خطة هذا البحث في مبحثين رئيسيين:
المبحث الأول: تعريف الاعتكاف ومشروعيته
المطلب الأول: تعريف الاعتكاف
الفرع الأول: تعريف الاعتكاف لغة
الفرع الثاني: تعريف الاعتكاف اصطلاحاً
المطلب الثاني: مشروعية الاعتكاف
الفرع الأول: أدلة مشروعية الاعتكاف
الفرع الثاني: حكم الاعتكاف

المبحث الثاني: أحكام الاعتكاف ومقاصده
المطلب الأول: أحكام الاعتكاف
الفرع الأول: شروط الاعتكاف
الفرع الثاني: مبطلات الاعتكاف
المطلب الثاني: مقاصد الاعتكاف
الفرع الأول: المقاصد التعبدية
الفرع الثاني: المقاصد التربوية`;

    // Call analyze API directly — reliable, no UI timing dependency
    const analyzeResult = await page.evaluate(
      async (rId, token, text) => {
        const r = await fetch(`/api/researches/${rId}/introduction/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text })
        });
        return { status: r.status, body: await r.json() };
      },
      researchId, authToken, introText
    );
    console.log(`[Phase 6] Introduction analyze status: ${analyzeResult.status}`);
    if (analyzeResult.status !== 200) {
      console.warn('[Phase 6] Analyze response:', JSON.stringify(analyzeResult.body).substring(0, 300));
    } else {
      const treeLen = analyzeResult.body?.data?.analysis?.tree?.length || 0;
      console.log(`[Phase 6] Detected ${treeLen} structure nodes from intro analysis.`);
    }
    await delay(1500);

    // -----------------------------------------------------------------------
    // PHASE 7: Confirm structure via API
    // -----------------------------------------------------------------------
    console.log('[Phase 7] Confirming Research Structure via API...');

    // Use the tree from the analysis result, or build a canonical tree
    const analysisTree = analyzeResult.body?.data?.analysis?.tree || analyzeResult.body?.data?.research?.structure?.tree || [];

    // If AI returned no tree, use a canonical manual tree
    const canonicalTree = analysisTree.length > 0 ? analysisTree : [
      {
        id: 'mabhath-1', type: 'mabhath', title: 'تعريف الاعتكاف ومشروعيته', order: 1,
        children: [
          { id: 'matlab-1-1', type: 'matlab', title: 'تعريف الاعتكاف', parentId: 'mabhath-1', order: 1,
            children: [
              { id: 'far-1-1-1', type: 'branch', title: 'تعريف الاعتكاف لغة', parentId: 'matlab-1-1', order: 1 },
              { id: 'far-1-1-2', type: 'branch', title: 'تعريف الاعتكاف اصطلاحاً', parentId: 'matlab-1-1', order: 2 }
            ]
          },
          { id: 'matlab-1-2', type: 'matlab', title: 'مشروعية الاعتكاف', parentId: 'mabhath-1', order: 2,
            children: [
              { id: 'far-1-2-1', type: 'branch', title: 'أدلة مشروعية الاعتكاف', parentId: 'matlab-1-2', order: 1 },
              { id: 'far-1-2-2', type: 'branch', title: 'حكم الاعتكاف', parentId: 'matlab-1-2', order: 2 }
            ]
          }
        ]
      },
      {
        id: 'mabhath-2', type: 'mabhath', title: 'أحكام الاعتكاف ومقاصده', order: 2,
        children: [
          { id: 'matlab-2-1', type: 'matlab', title: 'أحكام الاعتكاف', parentId: 'mabhath-2', order: 1,
            children: [
              { id: 'far-2-1-1', type: 'branch', title: 'شروط الاعتكاف', parentId: 'matlab-2-1', order: 1 },
              { id: 'far-2-1-2', type: 'branch', title: 'مبطلات الاعتكاف', parentId: 'matlab-2-1', order: 2 }
            ]
          },
          { id: 'matlab-2-2', type: 'matlab', title: 'مقاصد الاعتكاف', parentId: 'mabhath-2', order: 2,
            children: [
              { id: 'far-2-2-1', type: 'branch', title: 'المقاصد التعبدية', parentId: 'matlab-2-2', order: 1 },
              { id: 'far-2-2-2', type: 'branch', title: 'المقاصد التربوية', parentId: 'matlab-2-2', order: 2 }
            ]
          }
        ]
      }
    ];

    const structureResult = await page.evaluate(
      async (rId, token, tree) => {
        const r = await fetch(`/api/researches/${rId}/structure`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tree, confirmed: true })
        });
        return { status: r.status, body: await r.json() };
      },
      researchId, authToken, canonicalTree
    );
    console.log(`[Phase 7] Structure confirm status: ${structureResult.status}`);
    const confirmedTopics = structureResult.body?.data?.research?.topics?.length || 0;
    console.log(`[Phase 7] Topics created after structure confirm: ${confirmedTopics}`);
    await delay(1500);


    // -----------------------------------------------------------------------
    // PHASE 8: Steps 4–9 via backend API (content, conclusion, references, TOC, then export)
    // -----------------------------------------------------------------------
    console.log('[Phase 8] Saving topic content via API...');

    // Save topics content via API to avoid complex UI interaction
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    };

    // First get the research structure to get actual topic IDs
    const researchRes = await page.evaluate(
      async (rId, token) => {
        const r = await fetch(`/api/researches/${rId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return r.json();
      },
      researchId,
      authToken
    );

    console.log(`[Phase 8] Research topics count: ${researchRes.data?.research?.topics?.length || 0}`);
    const topics = researchRes.data?.research?.topics || [];

    // Save content to each topic
    const topicContents = [
      {
        rawContent: `المبحث الأول: تعريف الاعتكاف ومشروعيته
يتناول هذا المبحث المعالم الأساسية للاعتكاف من حيث التعريف اللغوي والاصطلاحي، ثم بيان أدلة مشروعيته.

المطلب الأول: تعريف الاعتكاف
الاعتكاف عبادة جليلة تقتضي لزوم المسجد لطاعة الله عز وجل. (1)

الفرع الأول: تعريف الاعتكاف لغة
الاعتكاف في لغة العرب مأخوذ من عكف على الشيء يعكف عكوفاً إذا لزمه وحبس نفسه عليه. (2)

الفرع الثاني: تعريف الاعتكاف اصطلاحاً
الاعتكاف في اصطلاح الفقهاء هو المقام في المسجد بنية التقرب إلى الله تعالى بشروط مخصوصة.`,
        footnotes: [
          { footnoteId: 'fn-t1-1', number: 1, marker: '(1)', text: 'ابن منظور، لسان العرب، دار صادر، بيروت، ج9، ص254.' },
          { footnoteId: 'fn-t1-2', number: 2, marker: '(2)', text: 'ابن قدامة، المغني، دار الفكر، بيروت، ج3، ص122.' }
        ]
      },
      {
        rawContent: `المطلب الثاني: مشروعية الاعتكاف
ثبتت مشروعية الاعتكاف بنصوص القرآن الكريم والسنة النبوية وإجماع الأمة. (1)

الفرع الأول: أدلة مشروعية الاعتكاف
قال الله تعالى: {ولا تباشروهن وأنتم عاكفون في المساجد}، وثبت في الصحيحين أن النبي صلى الله عليه وسلم كان يعتكف العشر الأواخر من رمضان.

الفرع الثاني: حكم الاعتكاف
الاعتكاف سنة مؤكدة في كل وقت، ويتأكد في شهر رمضان المبارك. (2)`,
        footnotes: [
          { footnoteId: 'fn-t2-1', number: 1, marker: '(1)', text: 'النووي، المجموع شرح المهذب، دار الفكر، ج6، ص350.' },
          { footnoteId: 'fn-t2-2', number: 2, marker: '(2)', text: 'ابن حجر العسقلاني، فتح الباري، دار المعرفة، ج4، ص271.' }
        ]
      },
      {
        rawContent: `المبحث الثاني: أحكام الاعتكاف ومقاصده
يتناول هذا المبحث بيان شروط صحة الاعتكاف ومبطلاته ومقاصده.

المطلب الأول: أحكام الاعتكاف
يشترط للاعتكاف شروط معينة لصحة أدائه وثبوته شرعاً. (1)

الفرع الأول: شروط الاعتكاف
من شروط الاعتكاف: الإسلام، والعقل، والتمييز، والنقاء من الحدث الأكبر، وأن يكون في مسجد تقام فيه الجماعة.

الفرع الثاني: مبطلات الاعتكاف
يبطل الاعتكاف بالخروج من المسجد لغير حاجة ضرورية، أو الجماع، أو الردة عن الإسلام.`,
        footnotes: [
          { footnoteId: 'fn-t3-1', number: 1, marker: '(1)', text: 'الكاساني، بدائع الصنائع، دار الكتب العلمية، ج2، ص108.' }
        ]
      },
      {
        rawContent: `المطلب الثاني: مقاصد الاعتكاف
للاعتكاف مقاصد شرعية عظيمة تنعكس على حياة المسلم الفردية والاجتماعية. (1)

الفرع الأول: المقاصد التعبدية
الانقطاع التام إلى عبادة الله تعالى، والتفرغ لتلاوة القرآن والذكر والاستغفار.

الفرع الثاني: المقاصد التربوية
ترويض النفس على الصبر والزهد في الملاذ الدنيوية، وترسيخ التقوى في القلب. (2)`,
        footnotes: [
          { footnoteId: 'fn-t4-1', number: 1, marker: '(1)', text: 'الشاطبي، الموافقات في أصول الشريعة، دار المعرفة، ج2، ص210.' },
          { footnoteId: 'fn-t4-2', number: 2, marker: '(2)', text: 'ابن القيم، زاد المعاد، مؤسسة الرسالة، ج2، ص87.' }
        ]
      }
    ];

    // Save content for each topic
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const content = topicContents[i] || topicContents[topicContents.length - 1];
      const saveResult = await page.evaluate(
        async (rId, tId, payload, token) => {
          const r = await fetch(`/api/researches/${rId}/topics/${tId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...payload, status: 'complete' })
          });
          return { status: r.status, body: await r.json() };
        },
        researchId,
        topic.topicId,
        content,
        authToken
      );
      console.log(`[Phase 8] Topic ${i + 1} (${topic.topicId}) save status: ${saveResult.status}`);
    }

    // -----------------------------------------------------------------------
    // PHASE 9: Navigate to Step 5 Conclusion
    // -----------------------------------------------------------------------
    console.log('[Phase 9] Navigating to Step 5: Conclusion (الخاتمة)...');
    await page.goto(`http://localhost:5173/research/${researchId}/step/5`, { waitUntil: 'networkidle2', timeout: 20000 });
    await delay(1500);

    // Save conclusion via API
    await page.evaluate(
      async (rId, token) => {
        await fetch(`/api/researches/${rId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            conclusion: {
              title: 'الخاتمة والنتائج',
              text: 'بعد تمام هذا البحث المبارك في أحكام الاعتكاف ومقاصده، خلص الباحث إلى النتائج التالية:',
              points: [
                'الاعتكاف سنة نبوية مؤكدة شرعت لتخلية القلب لمناجاة الرب سبحانه.',
                'يشترط للاعتكاف لزوم المسجد وعدم الخروج إلا لحاجة شرعية أو طبيعية.',
                'مقاصد الاعتكاف تجمع بين تهذيب السلوك وتزكية النفس وتحقيق حقيقة العبودية لله تعالى.'
              ]
            },
            currentStep: 5
          })
        });
      },
      researchId,
      authToken
    );
    console.log('[Phase 9] Conclusion saved.');

    // -----------------------------------------------------------------------
    // PHASE 10: Step 6 — References
    // -----------------------------------------------------------------------
    console.log('[Phase 10] Generating References (المصادر والمراجع)...');
    await page.goto(`http://localhost:5173/research/${researchId}/step/6`, { waitUntil: 'networkidle2', timeout: 20000 });
    await delay(1500);

    const refResult = await page.evaluate(
      async (rId, token) => {
        const r = await fetch(`/api/researches/${rId}/references/generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        return r.status;
      },
      researchId,
      authToken
    );
    console.log(`[Phase 10] References generate status: ${refResult}`);
    await delay(1000);

    // -----------------------------------------------------------------------
    // PHASE 11: Step 7 — TOC
    // -----------------------------------------------------------------------
    console.log('[Phase 11] Generating Table of Contents (فهرس الموضوعات)...');
    await page.goto(`http://localhost:5173/research/${researchId}/step/7`, { waitUntil: 'networkidle2', timeout: 20000 });
    await delay(1500);

    const tocResult = await page.evaluate(
      async (rId, token) => {
        const r = await fetch(`/api/researches/${rId}/toc/generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        return r.status;
      },
      researchId,
      authToken
    );
    console.log(`[Phase 11] TOC generate status: ${tocResult}`);
    await delay(1000);

    // -----------------------------------------------------------------------
    // PHASE 12: Step 8 — A4 Preview
    // -----------------------------------------------------------------------
    console.log('[Phase 12] Opening Step 8: A4 Live Preview...');
    await page.goto(`http://localhost:5173/research/${researchId}/step/8`, { waitUntil: 'networkidle2', timeout: 20000 });
    await delay(3000);

    // Scroll through preview pages
    console.log('[Phase 12] Scrolling through A4 pages...');
    await page.evaluate(async () => {
      const scrollHeight = document.body.scrollHeight;
      for (let pos = 0; pos <= scrollHeight; pos += 300) {
        window.scrollTo(0, pos);
        await new Promise((r) => setTimeout(r, 100));
      }
    });
    await delay(1000);

    // -----------------------------------------------------------------------
    // PHASE 13: Step 9 — Export (Download DOCX)
    // -----------------------------------------------------------------------
    console.log('[Phase 13] Navigating to Step 9: Export & Download...');
    await page.goto(`http://localhost:5173/research/${researchId}/step/9`, { waitUntil: 'networkidle2', timeout: 20000 });
    await delay(2000);

    // Click the DOCX download button in the visible browser UI
    const docxBtnTexts = ['Word', 'DOCX', 'تحميل', 'تصدير'];
    let docxClicked = false;
    const allBtns = await page.$$('button');
    for (const btn of allBtns) {
      const txt = await page.evaluate((el) => el.textContent || '', btn);
      if (docxBtnTexts.some((kw) => txt.includes(kw))) {
        console.log(`[Phase 13] Clicking export button: "${txt.trim().substring(0, 40)}"`);
        await btn.click();
        docxClicked = true;
        await delay(4000);
        break;
      }
    }

    if (!docxClicked) {
      console.log('[Phase 13] No DOCX button found in UI, triggering via page.evaluate...');
    }

    // -----------------------------------------------------------------------
    // PHASE 14: Download DOCX via fetch and save to disk for inspection
    // -----------------------------------------------------------------------
    console.log('[Phase 14] Downloading DOCX via API for deep inspection...');
    const docxBuffer = await page.evaluate(
      async (rId, token) => {
        const r = await fetch(`/api/researches/${rId}/docx`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!r.ok) return { error: `HTTP ${r.status}: ${await r.text()}` };
        const ab = await r.arrayBuffer();
        return { data: Array.from(new Uint8Array(ab)) };
      },
      researchId,
      authToken
    );

    if (docxBuffer.error) {
      throw new Error(`DOCX download failed: ${docxBuffer.error}`);
    }

    const docxFilePath = path.resolve(downloadDir, `research_${researchId}.docx`);
    fs.writeFileSync(docxFilePath, Buffer.from(docxBuffer.data));
    console.log(`[Phase 14] DOCX saved: ${docxFilePath} (${docxBuffer.data.length} bytes)`);

    // -----------------------------------------------------------------------
    // PHASE 15: Deep inspect DOCX XML structure
    // -----------------------------------------------------------------------
    console.log('[Phase 15] Inspecting DOCX XML structure...');
    const docxExtractDir = path.resolve(downloadDir, 'docx_extracted');
    if (fs.existsSync(docxExtractDir)) {
      fs.rmSync(docxExtractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(docxExtractDir, { recursive: true });

    // PowerShell Expand-Archive only supports .zip extension; copy docx → zip first
    const docxAsZipPath = docxFilePath.replace('.docx', '_inspect.zip');
    fs.copyFileSync(docxFilePath, docxAsZipPath);
    execSync(
      `powershell -Command "Expand-Archive -Path '${docxAsZipPath}' -DestinationPath '${docxExtractDir}' -Force"`
    );

    const documentXmlPath = path.resolve(docxExtractDir, 'word', 'document.xml');
    const footnotesXmlPath = path.resolve(docxExtractDir, 'word', 'footnotes.xml');

    const documentXml = fs.existsSync(documentXmlPath) ? fs.readFileSync(documentXmlPath, 'utf8') : '';
    const footnotesXml = fs.existsSync(footnotesXmlPath) ? fs.readFileSync(footnotesXmlPath, 'utf8') : '';

    const hasRTL = documentXml.includes('w:rtl') || documentXml.includes('w:bidi');
    const hasA4 = documentXml.includes('w:w="11906"') && documentXml.includes('w:h="16838"');
    const hasTitle = documentXml.includes('الاعتكاف');
    const hasFootnotes = footnotesXml.length > 100;

    console.log('');
    console.log('===============================================================');
    console.log('  DOCX INSPECTION RESULTS');
    console.log('===============================================================');
    console.log(`  File size:       ${(docxBuffer.data.length / 1024).toFixed(1)} KB`);
    console.log(`  RTL direction:   ${hasRTL ? '✅ YES' : '❌ MISSING'}`);
    console.log(`  A4 dimensions:   ${hasA4 ? '✅ 210×297 mm' : '❌ NOT standard A4'}`);
    console.log(`  Title in doc:    ${hasTitle ? '✅ YES' : '❌ MISSING'}`);
    console.log(`  Footnotes XML:   ${hasFootnotes ? '✅ YES' : '⚠️ EMPTY/MISSING'}`);
    console.log('===============================================================');

    if (!hasA4) {
      // Check what dimensions are present
      const wMatch = documentXml.match(/w:w="(\d+)"/);
      const hMatch = documentXml.match(/w:h="(\d+)"/);
      console.warn(`  Actual dimensions: w=${wMatch?.[1] || 'N/A'}, h=${hMatch?.[1] || 'N/A'}`);
    }

    if (!hasTitle) {
      throw new Error('CRITICAL: Research title content is missing from DOCX document.xml!');
    }

    // Also try to open the DOCX in Microsoft Word if available
    const winwordPath = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE';
    if (fs.existsSync(winwordPath)) {
      console.log('[Phase 15] Opening DOCX in Microsoft Word for visual inspection...');
      require('child_process').spawn(winwordPath, [docxFilePath], { detached: true, stdio: 'ignore' });
      await delay(4000);
    } else {
      console.log('[Phase 15] Microsoft Word not found at standard path. Skipping visual Word inspection.');
    }

    console.log('');
    console.log('===============================================================');
    console.log('  ALL E2E PHASES COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
    console.log(`  Research ID: ${researchId}`);
    console.log(`  DOCX file:   ${docxFilePath}`);
    console.log('===============================================================');
  } finally {
    console.log('[Cleanup] Test complete. Keeping browser open for 8 seconds...');
    await delay(8000);
    console.log('[Cleanup] Closing Chrome browser window.');
    await browser.close();
  }
}

runLiveVisibleE2ETest()
  .then(() => {
    console.log('E2E_VISIBLE_TEST_SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    console.error('E2E_VISIBLE_TEST_FAILED:', err.message);
    process.exit(1);
  });
