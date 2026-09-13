const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const testEmail = `error_test_${Date.now()}@test.com`;
    console.log('1. Registering real test user...');
    await page.goto('http://localhost:4173/register', { waitUntil: 'networkidle0' });

    const nameInput = await page.$('input[type="text"]');
    await nameInput.type('مختبر فحص الأخطاء');

    const emailInput = await page.$('input[type="email"]');
    await emailInput.type(testEmail);

    const passInput = await page.$('input[type="password"]');
    await passInput.type('Password123!');

    const submitBtn = await page.$('button[type="submit"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      submitBtn.click()
    ]);

    console.log('2. Logged in and reached:', page.url());

    // Now intercept only POST /api/researches to simulate server 500 error
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.url().includes('/api/researches') && req.method() === 'POST') {
        console.log('Simulating 500 server failure on:', req.url());
        req.respond({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'فشل في الاتصال بقاعدة البيانات' })
        });
      } else {
        req.continue();
      }
    });

    console.log('3. Navigating to /research/new (with simulated 500 error)...');
    await page.goto('http://localhost:4173/research/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const pageContent = await page.content();
    if (pageContent.includes('تعذر') && pageContent.includes('إعادة المحاولة')) {
      console.log('SUCCESS: Error card, message, and Retry button are displayed!');
    } else {
      console.error('FAILURE: Error UI was not detected.');
    }

    await page.screenshot({ path: '../error_ui_verified.png' });
    console.log('4. Screenshot saved to error_ui_verified.png');

    await browser.close();
    console.log('TEST COMPLETED.');
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
})();
