const puppeteer = require('puppeteer');
let browserInstance = null;

/**
 * Returns a lazily-initialized Puppeteer Browser instance.
 * The same instance is reused across the application.
 * It uses the same launch options as the PDF generator.
 */
async function getBrowser() {
  if (browserInstance) return browserInstance;
  // Default launch options – mirror pdfGenerator settings
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  browserInstance = await puppeteer.launch(launchOptions);
  // Graceful shutdown
  const shutdown = async () => {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
  };
  process.on('exit', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return browserInstance;
}

async function closeBrowser() {
  if (!browserInstance) return;
  const browser = browserInstance;
  browserInstance = null;
  await browser.close();
}

module.exports = { getBrowser, closeBrowser };
