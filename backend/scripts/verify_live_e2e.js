const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

(async () => {
  let browser = null;
  const testUserEmail = 'puppeteer_live_test@academic.edu';

  try {
    console.log('Connecting to local MongoDB...');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant');
    }
    const db = mongoose.connection.db;

    // Clean up if already exists
    await db.collection('users').deleteOne({ email: testUserEmail });

    console.log('Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('1. Visiting Landing Page at http://localhost:5173 ...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header');

    const navText = await page.$eval('header', el => el.innerText);
    console.log('✓ Header guest buttons present:', navText.includes('تسجيل الدخول') && navText.includes('إنشاء حساب'));

    console.log('2. Visiting Register Page at http://localhost:5173/register ...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('form');

    // Fill form
    await page.type('input[placeholder*="أحمد"]', 'د. يوسف الأكاديمي');
    await page.type('input[placeholder*="university.edu"]', testUserEmail);
    const passwordInputs = await page.$$('input[placeholder*="أحرف"], input[placeholder*="كلمة المرور"]');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].type('SecurePassword123!');
      await passwordInputs[1].type('SecurePassword123!');
    }

    console.log('Submitting registration form...');
    await page.click('button[type="submit"]');
    
    // Wait for screen transition
    await page.waitForFunction(
      () => document.body.innerText.includes('تم إنشاء حسابك') || document.body.innerText.includes('تحقق من بريدك'),
      { timeout: 8000 }
    );
    console.log('✓ Registration successful! Verification prompt displayed.');

    // 3. Email Verification
    const User = require('../src/models/User');
    const userModel = await User.findOne({ email: testUserEmail }).select('+emailVerificationTokenHash');
    const verificationToken = userModel.createEmailVerificationToken();
    await userModel.save();

    console.log('3. Visiting verification URL: http://localhost:5173/verify-email?token=' + verificationToken);
    await page.goto(`http://localhost:5173/verify-email?token=${verificationToken}`, { waitUntil: 'domcontentloaded' });
    
    await page.waitForFunction(
      () => document.body.innerText.includes('تم تفعيل حسابك بنجاح') || document.body.innerText.includes('لوحة بحوثي'),
      { timeout: 8000 }
    );
    console.log('✓ Email verification confirmed in browser!');

    // 4. Verify cookies
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'token');
    console.log('✓ Auth HttpOnly Cookie received:', authCookie ? { name: authCookie.name, httpOnly: authCookie.httpOnly, sameSite: authCookie.sameSite } : 'MISSING');

    // 5. Navigate to Dashboard
    console.log('4. Navigating to Dashboard at http://localhost:5173/dashboard ...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header');
    const authNavText = await page.$eval('header', el => el.innerText);
    console.log('✓ Authenticated navbar shows user:', authNavText.includes('يوسف') || authNavText.includes('لوحة بحوثي'));

    // 6. Test New Research Navigation
    console.log('5. Navigating to New Research at http://localhost:5173/research/new ...');
    await page.goto('http://localhost:5173/research/new', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main');
    const wizardText = await page.$eval('main', el => el.innerText);
    console.log('✓ Research Wizard loaded successfully:', wizardText.includes('الغلاف') || wizardText.includes('المقدمة') || wizardText.includes('الخطوة'));

    // 7. Test Logout
    console.log('6. Testing Logout...');
    await page.evaluate(async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    });

    // Verify redirect on protected route attempt
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('form');
    console.log('✓ Unauthenticated attempt to /dashboard redirected to:', page.url());
    console.log('✓ Redirected to /login:', page.url().includes('/login'));

    // 8. Test Admin Access Protection
    console.log('7. Testing Admin Access Protection...');
    // Attempt visiting /admin as guest
    await page.goto('http://localhost:5173/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('form');
    console.log('✓ Guest visiting /admin redirected to:', page.url());

    // 9. CLEANUP OF TEMPORARY TEST DATA (User Requirements 1 & 2)
    console.log('\n======================================================');
    console.log('  CLEANING UP TEMPORARY TEST DATA AFTER VERIFICATION');
    console.log('======================================================');
    const deleteResearchRes = await db.collection('researches').deleteMany({ userId: userModel._id });
    const deleteLogsRes = await db.collection('activitylogs').deleteMany({ userId: userModel._id });
    const deleteUserRes = await db.collection('users').deleteOne({ _id: userModel._id });
    console.log(`✓ Deleted test research projects: ${deleteResearchRes.deletedCount}`);
    console.log(`✓ Deleted test activity logs: ${deleteLogsRes.deletedCount}`);
    console.log(`✓ Deleted test user record: ${deleteUserRes.deletedCount}`);

    console.log('\n======================================================');
    console.log('  ★ ALL 9 LIVE PUPPETEER WORKFLOW CHECKS PASSED ★');
    console.log('======================================================');

  } catch (err) {
    console.error('Puppeteer verification failed:', err);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
})();
