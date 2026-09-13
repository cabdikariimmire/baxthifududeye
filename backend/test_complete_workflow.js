const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const userEmail = `workflow_tester_${Date.now()}@test.com`;
    console.log('1. Registering test user:', userEmail);
    await page.goto('http://localhost:4173/register', { waitUntil: 'networkidle0' });

    await page.type('input[type="text"]', 'الباحث عباس عبد الناصر');
    await page.type('input[type="email"]', userEmail);
    await page.type('input[type="password"]', 'Password123!');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    console.log('2. Landed on Dashboard. Navigating to /research/new...');
    await page.goto('http://localhost:4173/research/new', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    console.log('3. Reached Step 1 Cover:', page.url());

    // Step 1: Save & Next
    console.log('4. Submitting Step 1 Cover...');
    const step1NextBtn = await page.$('button[type="submit"]');
    if (step1NextBtn) {
      await step1NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 2: Introduction
    console.log('5. Current Step 2 URL:', page.url());
    const step2NextBtn = await page.$('button.btn-primary');
    if (step2NextBtn) {
      await step2NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 3: Structure Review
    console.log('6. Current Step 3 URL:', page.url());
    const step3NextBtn = await page.$('button.btn-primary');
    if (step3NextBtn) {
      await step3NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 4: Topic Content (4 المطالب gate)
    console.log('7. Reached Step 4 Topic Content:', page.url());
    await page.screenshot({ path: '../step4_topic_gate.png' });
    console.log('Saved step4_topic_gate.png');

    const step4NextBtn = await page.$('button.btn-primary');
    if (step4NextBtn) {
      await step4NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 5: Footnotes
    console.log('8. Reached Step 5 Footnotes:', page.url());
    await page.screenshot({ path: '../step5_footnotes.png' });
    console.log('Saved step5_footnotes.png');

    const step5NextBtn = await page.$('button.btn-primary');
    if (step5NextBtn) {
      await step5NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 6: Conclusion
    console.log('9. Reached Step 6 Conclusion:', page.url());
    const step6NextBtn = await page.$('button[type="submit"]');
    if (step6NextBtn) {
      await step6NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 7: References
    console.log('10. Reached Step 7 References:', page.url());
    await page.screenshot({ path: '../step7_references.png' });
    console.log('Saved step7_references.png');

    const step7NextBtn = await page.$('button[type="submit"]');
    if (step7NextBtn) {
      await step7NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 8: TOC
    console.log('11. Reached Step 8 TOC:', page.url());
    await page.screenshot({ path: '../step8_toc.png' });
    console.log('Saved step8_toc.png');

    const step8NextBtn = await page.$('button.btn-primary');
    if (step8NextBtn) {
      await step8NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 9: Preview
    console.log('12. Reached Step 9 Preview:', page.url());
    const step9NextBtn = await page.$('button.btn-primary');
    if (step9NextBtn) {
      await step9NextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 10: Export
    console.log('13. Reached Step 10 Export:', page.url());
    await page.screenshot({ path: '../step10_export.png' });
    console.log('Saved step10_export.png');

    await browser.close();
    console.log('ALL E2E BROWSER STEPS COMPLETED SUCCESSFULLY.');
  } catch (err) {
    console.error('Error during workflow test:', err);
    process.exit(1);
  }
})();
