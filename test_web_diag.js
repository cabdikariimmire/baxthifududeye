const puppeteer = require('./backend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('--- Starting Web Diagnostic ---');
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (e) {
    console.error('Failed to launch Chrome:', e);
    process.exit(1);
  }

  const page = await browser.newPage();
  const consoleMessages = [];
  const errors = [];
  const failedRequests = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    errors.push(err.stack || err.toString());
  });

  page.on('requestfailed', req => {
    failedRequests.push({
      url: req.url(),
      method: req.method(),
      error: req.failure() ? req.failure().errorText : 'Unknown'
    });
  });

  console.log('Navigating to http://localhost:5173 ...');
  let status = null;
  try {
    const res = await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
    status = res ? res.status() : 'No response';
    console.log('Response Status:', status);
  } catch (e) {
    console.error('Goto error:', e.message);
  }

  const title = await page.title();
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  
  console.log('Page Title:', title);
  console.log('Root HTML Length:', rootHtml.length);
  if (rootHtml.length < 500) {
    console.log('Root HTML snippet:', rootHtml);
  }

  console.log('\n--- Console Logs (' + consoleMessages.length + ') ---');
  consoleMessages.forEach(m => console.log(`[${m.type}] ${m.text}`));

  console.log('\n--- Page Errors (' + errors.length + ') ---');
  errors.forEach(e => console.error(e));

  console.log('\n--- Failed Requests (' + failedRequests.length + ') ---');
  failedRequests.forEach(f => console.log(`${f.method} ${f.url} => ${f.error}`));

  // Also test routes like /login, /register, /dashboard
  console.log('\nTesting /login navigation...');
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('/login title:', await page.title());
    const loginHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
    console.log('/login root length:', loginHtml.length);
  } catch (e) {
    console.error('Error on /login:', e.message);
  }

  // Check backend APIs
  console.log('\nTesting Backend /api/auth/me without auth...');
  try {
    await page.goto('http://localhost:5173/api/auth/me', { waitUntil: 'networkidle2', timeout: 5000 });
    const apiText = await page.evaluate(() => document.body.innerText);
    console.log('Backend /api/auth/me response:', apiText);
  } catch (e) {
    console.error('Error on /api/auth/me:', e.message);
  }

  await browser.close();
  console.log('\n--- Diagnostic Finished ---');
})();
