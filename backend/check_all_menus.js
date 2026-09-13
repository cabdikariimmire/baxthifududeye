const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:5173';

// All pages/menus to check
const pages = [
  { name: '01_landing_page', url: '/', description: 'Landing Page (Homepage)' },
  { name: '02_dashboard', url: '/dashboard', description: 'Dashboard (لوحة بحوثي)' },
  { name: '03_new_research', url: '/research/new', description: 'New Research Wizard (بحث جديد)' },
  { name: '04_admin_overview', url: '/admin', description: 'Admin Overview (لوحة التحكم)' },
  { name: '05_admin_users', url: '/admin/users', description: 'Admin Users (المستخدمون)' },
  { name: '06_admin_researches', url: '/admin/researches', description: 'Admin Researches (الأبحاث)' },
  { name: '07_admin_activity', url: '/admin/activity', description: 'Admin Activity (الأنشطة)' },
  { name: '08_admin_reports', url: '/admin/reports', description: 'Admin Reports (التقارير)' },
  { name: '09_admin_settings', url: '/admin/settings', description: 'Admin Settings (إعدادات النظام)' },
];

async function main() {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('=== Website Menu Audit ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}`);
  console.log('');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const results = [];

  for (const page of pages) {
    const fullUrl = BASE_URL + page.url;
    console.log(`\n--- Checking: ${page.description} ---`);
    console.log(`URL: ${fullUrl}`);

    const tab = await browser.newPage();
    const consoleErrors = [];
    const networkErrors = [];

    // Capture console errors
    tab.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture network failures
    tab.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText || 'unknown'}`);
    });

    try {
      const response = await tab.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      const httpStatus = response ? response.status() : 'N/A';

      // Wait a bit for any dynamic content
      await new Promise(r => setTimeout(r, 1500));

      // Get page title
      const title = await tab.title();

      // Get visible text content summary (first 500 chars)
      const bodyText = await tab.evaluate(() => {
        return document.body?.innerText?.substring(0, 800) || '[empty body]';
      });

      // Check for visible error messages in the DOM
      const visibleErrors = await tab.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]');
        return Array.from(errorElements).map(el => el.innerText).filter(t => t.length > 0);
      });

      // Check navbar links (for non-admin pages)
      const navLinks = await tab.evaluate(() => {
        const links = document.querySelectorAll('header a, nav a');
        return Array.from(links).map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href'),
          visible: a.offsetParent !== null
        }));
      });

      // Check sidebar links (for admin pages)
      const sidebarLinks = await tab.evaluate(() => {
        const links = document.querySelectorAll('aside a');
        return Array.from(links).map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href'),
          visible: a.offsetParent !== null,
          isActive: a.className.includes('active') || a.className.includes('Active') || a.className.includes('teal-200')
        }));
      });

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `${page.name}.png`);
      await tab.screenshot({ path: screenshotPath, fullPage: true });

      // Also take a viewport-only screenshot
      const viewportScreenshotPath = path.join(SCREENSHOT_DIR, `${page.name}_viewport.png`);
      await tab.screenshot({ path: viewportScreenshotPath, fullPage: false });

      const result = {
        page: page.description,
        url: fullUrl,
        httpStatus,
        title,
        status: httpStatus === 200 ? '✅ OK' : `⚠️ HTTP ${httpStatus}`,
        screenshotPath,
        navLinks: navLinks.filter(l => l.visible),
        sidebarLinks: sidebarLinks.filter(l => l.visible),
        consoleErrors,
        networkErrors,
        visibleErrors,
        bodyTextPreview: bodyText.substring(0, 300)
      };

      results.push(result);

      console.log(`  HTTP Status: ${httpStatus}`);
      console.log(`  Title: ${title}`);
      console.log(`  Nav Links: ${result.navLinks.length}`);
      console.log(`  Sidebar Links: ${result.sidebarLinks.length}`);
      console.log(`  Console Errors: ${consoleErrors.length}`);
      console.log(`  Network Errors: ${networkErrors.length}`);
      console.log(`  Screenshot: ${screenshotPath}`);

      if (consoleErrors.length > 0) {
        console.log(`  ⚠️ Console Errors:`);
        consoleErrors.forEach(e => console.log(`    - ${e.substring(0, 200)}`));
      }
      if (networkErrors.length > 0) {
        console.log(`  ⚠️ Network Errors:`);
        networkErrors.forEach(e => console.log(`    - ${e.substring(0, 200)}`));
      }
      if (visibleErrors.length > 0) {
        console.log(`  ⚠️ Visible DOM Errors:`);
        visibleErrors.forEach(e => console.log(`    - ${e.substring(0, 200)}`));
      }

    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
      results.push({
        page: page.description,
        url: fullUrl,
        status: `❌ FAILED: ${err.message}`,
        consoleErrors,
        networkErrors
      });

      // Try to take screenshot even on error
      try {
        const errorScreenshotPath = path.join(SCREENSHOT_DIR, `${page.name}_error.png`);
        await tab.screenshot({ path: errorScreenshotPath, fullPage: false });
      } catch (_) {}
    }

    await tab.close();
  }

  // Print summary report
  console.log('\n\n========================================');
  console.log('         FULL AUDIT SUMMARY REPORT');
  console.log('========================================\n');

  for (const r of results) {
    console.log(`📄 ${r.page}`);
    console.log(`   URL: ${r.url}`);
    console.log(`   Status: ${r.status}`);
    if (r.title) console.log(`   Title: ${r.title}`);
    if (r.navLinks && r.navLinks.length > 0) {
      console.log(`   Navbar Links:`);
      r.navLinks.forEach(l => console.log(`     - [${l.text}] → ${l.href}`));
    }
    if (r.sidebarLinks && r.sidebarLinks.length > 0) {
      console.log(`   Sidebar Links:`);
      r.sidebarLinks.forEach(l => console.log(`     - [${l.text}] → ${l.href} ${l.isActive ? '(ACTIVE)' : ''}`));
    }
    if (r.consoleErrors && r.consoleErrors.length > 0) {
      console.log(`   ⚠️ Console Errors: ${r.consoleErrors.length}`);
      r.consoleErrors.forEach(e => console.log(`     - ${e.substring(0, 150)}`));
    }
    if (r.networkErrors && r.networkErrors.length > 0) {
      console.log(`   ⚠️ Network Errors: ${r.networkErrors.length}`);
      r.networkErrors.forEach(e => console.log(`     - ${e.substring(0, 150)}`));
    }
    if (r.visibleErrors && r.visibleErrors.length > 0) {
      console.log(`   ⚠️ Visible Error Elements: ${r.visibleErrors.length}`);
      r.visibleErrors.forEach(e => console.log(`     - ${e.substring(0, 150)}`));
    }
    if (r.bodyTextPreview) {
      console.log(`   Content Preview: ${r.bodyTextPreview.substring(0, 120).replace(/\n/g, ' | ')}...`);
    }
    console.log('');
  }

  // Summary counts
  const okCount = results.filter(r => r.status?.startsWith('✅')).length;
  const failCount = results.filter(r => r.status?.startsWith('❌')).length;
  const warnCount = results.filter(r => r.status?.startsWith('⚠️')).length;
  const totalConsoleErrors = results.reduce((sum, r) => sum + (r.consoleErrors?.length || 0), 0);
  const totalNetworkErrors = results.reduce((sum, r) => sum + (r.networkErrors?.length || 0), 0);

  console.log('--- Overall Summary ---');
  console.log(`Total Pages Checked: ${results.length}`);
  console.log(`✅ OK: ${okCount}`);
  console.log(`⚠️ Warnings: ${warnCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Total Console Errors: ${totalConsoleErrors}`);
  console.log(`Total Network Errors: ${totalNetworkErrors}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  await browser.close();
  console.log('\n=== Audit Complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
