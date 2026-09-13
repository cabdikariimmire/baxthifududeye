const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const userEmail = `export_test_${Date.now()}@test.com`;
    console.log('1. Registering user...');
    await page.goto('http://localhost:4173/register', { waitUntil: 'networkidle0' });
    await page.type('input[type="text"]', 'الباحث عباس');
    await page.type('input[type="email"]', userEmail);
    await page.type('input[type="password"]', 'Password123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // Create research
    await page.goto('http://localhost:4173/research/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    const url = page.url();
    const researchId = url.split('/research/')[1].split('/')[0];
    console.log('2. Created research:', researchId);

    // Navigate directly to Step 7 References
    console.log('3. Navigating to Step 7 References...');
    await page.goto(`http://localhost:4173/research/${researchId}/step/7`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: '../step7_references.png' });
    console.log('Saved step7_references.png');

    // Navigate directly to Step 8 TOC
    console.log('4. Navigating to Step 8 TOC...');
    await page.goto(`http://localhost:4173/research/${researchId}/step/8`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: '../step8_toc.png' });
    console.log('Saved step8_toc.png');

    // Navigate directly to Step 10 Export
    console.log('5. Navigating to Step 10 Export...');
    await page.goto(`http://localhost:4173/research/${researchId}/step/10`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: '../step10_export.png' });
    console.log('Saved step10_export.png');

    await browser.close();
    console.log('ALL SCREENSHOTS CAPTURED.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
