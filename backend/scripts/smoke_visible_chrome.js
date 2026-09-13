const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function runSmokeTest() {
  console.log('[Smoke Test] Starting Visible Chrome Smoke Test...');
  
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome binary not found at: ${chromePath}`);
  }
  console.log(`[Smoke Test] Found Chrome at: ${chromePath}`);

  const tempProfileDir = path.resolve('C:\\Users\\cxc\\Desktop\\rese\\.tmp_chrome_profile');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  const screenshotPath = path.resolve('C:\\Users\\cxc\\Desktop\\rese\\scratch_visible_smoke.png');

  console.log('[Smoke Test] Launching Chrome in VISIBLE mode (headless: false)...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    defaultViewport: null,
    slowMo: 100,
    args: [
      `--user-data-dir=${tempProfileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-size=1280,850',
      '--window-position=100,100'
    ]
  });

  try {
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    console.log('[Smoke Test] Navigating to http://localhost:5173 ...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });

    const title = await page.title();
    console.log(`[Smoke Test] Page Title loaded: "${title}"`);

    // Wait 5 seconds with visible window on screen so user sees it clearly
    console.log('[Smoke Test] Chrome window is visible on desktop. Holding for 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    console.log(`[Smoke Test] Taking screenshot to: ${screenshotPath}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log('[Smoke Test] Verification complete.');
  } finally {
    console.log('[Smoke Test] Closing browser.');
    await browser.close();
  }
}

runSmokeTest()
  .then(() => {
    console.log('VISIBLE BROWSER READY');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Smoke Test Error]:', err);
    process.exit(1);
  });
