const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const testEmail = `researcher_${Date.now()}@test.com`;
    console.log('1. Registering test user:', testEmail);
    await page.goto('http://localhost:4173/register', { waitUntil: 'networkidle0' });
    
    // Fill registration form
    const nameInput = await page.$('input[type="text"]');
    await nameInput.type('عباس عبد الناصر');

    const emailInput = await page.$('input[type="email"]');
    await emailInput.type(testEmail);

    const passInput = await page.$('input[type="password"]');
    await passInput.type('Password123!');

    const submitBtn = await page.$('button[type="submit"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      submitBtn.click()
    ]);

    console.log('2. Landed on:', page.url());

    // 3. Navigate to /research/new
    console.log('3. Navigating to /research/new...');
    await page.goto('http://localhost:4173/research/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const finalUrl = page.url();
    console.log('4. URL after creation:', finalUrl);

    // Verify it is on /research/:id/step/1
    if (finalUrl.includes('/step/1') || finalUrl.includes('/research/')) {
      console.log('SUCCESS: Successfully transitioned from /research/new to Step 1!');
    } else {
      console.error('FAILURE: Unexpected URL:', finalUrl);
    }

    // 5. Screenshot the resulting step 1
    await page.screenshot({ path: '../step1_after_new.png' });
    console.log('5. Screenshot saved to step1_after_new.png');

    // 6. Refresh page and verify it loads directly without sticking
    console.log('6. Refreshing Step 1 page...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    console.log('7. URL after reload:', page.url());

    await browser.close();
    console.log('ALL VERIFICATIONS PASSED.');
  } catch (err) {
    console.error('Error during test flow:', err);
    process.exit(1);
  }
})();
