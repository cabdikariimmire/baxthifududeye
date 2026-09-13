// Simple async page pool for Puppeteer pages
// Ensures each measurement gets an isolated page (no concurrent mutation)

const { getBrowser } = require('./browserSingleton');

const MAX_POOL_SIZE = 3; // reasonable balance between reuse and memory
const pagePool = [];

/**
 * Acquire a fresh Page from the pool or create a new one if pool empty.
 * Caller must later call releasePage(page).
 */
async function acquirePage() {
  const browser = await getBrowser();
  if (pagePool.length > 0) {
    return pagePool.pop();
  }
  return await browser.newPage();
}

/**
 * Release a Page back to the pool. If the pool is already at max size, close the page.
 */
async function releasePage(page) {
  if (!page) return;
  if (pagePool.length < MAX_POOL_SIZE) {
    // The next measurement replaces the full document with setContent. A
    // blank navigation here is unnecessary and expensive for long sections;
    // the page is never handed to two callers at the same time.
    pagePool.push(page);
  } else {
    await page.close();
  }
}

module.exports = { acquirePage, releasePage };
