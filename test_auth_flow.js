const puppeteer = require('./backend/node_modules/puppeteer');

(async () => {
  console.log('--- Testing User Registration & Login Flow ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log(`[BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER ERROR]: ${err}`));

  // 1. Navigate to /register
  console.log('\n1. Navigating to /register...');
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2', timeout: 15000 });
  await page.screenshot({ path: 'scratch_reg.png' });

  // 2. Fill registration form
  console.log('Filling registration form...');
  const testEmail = `testuser_${Date.now()}@example.com`;
  await page.type('input[type="text"]', 'باحث تجريبي');
  await page.type('input[type="email"]', testEmail);
  await page.type('input[type="password"]', 'password123');
  
  console.log('Submitting registration form...');
  await page.click('button[type="submit"]');

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL after submit:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body text snippet:\n', bodyText.substring(0, 400));

  await browser.close();
  console.log('\n--- Test Completed ---');
})();
