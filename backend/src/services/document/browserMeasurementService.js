// Browser-based measurement service for Arabic text using Amiri font
// Returns deterministic measurements (widthPt, heightPt, lineCount, lineHeightPt, measuredWidthPx, measuredHeightPx)

const { acquirePage, releasePage } = require('../../utils/pagePool');
const crypto = require('crypto');

// In‑memory LRU cache (simple Map with insertion order tracking)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(opts) {
  const keyObj = {
    text: opts.text,
    fontFamily: opts.fontFamily,
    fontSizePt: opts.fontSizePt,
    fontWeight: opts.fontWeight,
    lineHeight: opts.lineHeight,
    widthMm: opts.widthMm,
    textAlign: opts.textAlign,
    direction: opts.direction,
  };
  return crypto.createHash('sha256').update(JSON.stringify(keyObj)).digest('hex');
}

function setCache(key, value) {
  // Remove if exists to update order
  if (cache.has(key)) cache.delete(key);
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  // Simple size limit (e.g., 200 entries)
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  // Refresh LRU order
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

/**
 * Convert millimeters to points (1pt = 1/72 inch, 1mm = 72/25.4 pt)
 */
function mmToPt(mm) {
  return (mm * 72) / 25.4;
}

/**
 * Main measurement function.
 * opts must include:
 *   text, fontFamily ("Amiri"), fontSizePt, fontWeight, lineHeight (unitless multiplier),
 *   widthMm (content width), textAlign, direction ('rtl' or 'ltr')
 */
async function measureText(opts) {
  const {
    text,
    fontFamily = 'Amiri',
    fontSizePt,
    fontWeight = 'normal',
    lineHeight = 1.0,
    widthMm = 160,
    textAlign = 'justify',
    direction = 'rtl',
  } = opts;

  const cacheKey = getCacheKey({ text, fontFamily, fontSizePt, fontWeight, lineHeight, widthMm, textAlign, direction });
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const page = await acquirePage();
  try {
    if (!Number.isFinite(Number(fontSizePt)) || Number(fontSizePt) <= 0) {
      throw new Error(`Browser measurement requires a positive font size; received ${fontSizePt}`);
    }
    if (!Number.isFinite(Number(widthMm)) || Number(widthMm) <= 0) {
      throw new Error(`Browser measurement requires a positive width; received ${widthMm}mm`);
    }
    if (typeof text !== 'string' || !text.trim()) {
      return {
        widthPt: mmToPt(widthMm),
        heightPt: 0,
        lineCount: 0,
        lineHeightPt: Number(fontSizePt) * Number(lineHeight),
        measuredWidthPx: mmToPt(widthMm) * (96 / 72),
        measuredHeightPx: 0,
      };
    }

    // Build a minimal HTML page. Text is inserted before font loading so the
    // browser lays out the real content after the requested font is ready.
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="${direction}">
      <head>
        <meta charset="UTF-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');
          body { margin:0; padding:0; }
          #measure {
            font-family: '${fontFamily}', serif;
            font-size: ${fontSizePt}pt;
            font-weight: ${fontWeight};
            line-height: ${lineHeight};
            width: ${mmToPt(widthMm)}pt;
            text-align: ${textAlign};
            direction: ${direction};
            white-space: pre-wrap;
            word-break: normal;
            overflow-wrap: normal;
          }
        </style>
      </head>
      <body>
        <div id="measure"></div>
      </body>
      </html>`;

    // `domcontentloaded` is too early for an @import font stylesheet: the
    // Font Loading API can otherwise return an empty set while the element is
    // still laid out in the fallback font.
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });

    const fontReady = await Promise.race([
      page.evaluate(async ({ requestedText, requestedFamily, requestedSize }) => {
        const container = document.getElementById('measure');
        container.textContent = requestedText;

        // CSS Font Loading accepts the family token without quotes here. The
        // element itself still uses the quoted CSS family declaration above.
        const fontSpec = `${requestedSize}pt ${requestedFamily}`;
        const loadedFaces = await document.fonts.load(fontSpec, requestedText);
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const fontLoaded = loadedFaces.length > 0 && document.fonts.check(fontSpec, requestedText);
        return { fontLoaded, loadedFaceCount: loadedFaces.length };
      }, { requestedText: text, requestedFamily: fontFamily, requestedSize: fontSizePt }),
      new Promise((_, reject) => setTimeout(() => reject(new Error(
        `Timed out while loading ${fontFamily} for browser measurement`
      )), 10000))
    ]);

    if (!fontReady.fontLoaded) {
      throw new Error(
        `Required font ${fontFamily} was not loaded for browser measurement ` +
        `(loaded faces: ${fontReady.loadedFaceCount})`
      );
    }

    // Perform measurement
    const result = await page.evaluate(() => {
      const el = document.getElementById('measure');
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const lineHeightPx = parseFloat(style.lineHeight);
      const lineCount = Math.max(1, Math.round(rect.height / lineHeightPx));
      return {
        widthPx: rect.width,
        heightPx: rect.height,
        lineCount,
        lineHeightPx,
      };
    });

    // Convert to points (1pt = 96/72 px) – Puppeteer runs at 96 DPI
    const pxToPt = 72 / 96;
    const widthPt = result.widthPx * pxToPt;
    const heightPt = result.heightPx * pxToPt;
    const lineHeightPt = result.lineHeightPx * pxToPt;

    const final = {
      widthPt,
      heightPt,
      lineCount: result.lineCount,
      lineHeightPt,
      measuredWidthPx: result.widthPx,
      measuredHeightPx: result.heightPx,
    };

    if (!Number.isFinite(final.heightPt) || final.heightPt <= 0 ||
        !Number.isFinite(final.lineCount) || final.lineCount < 1 ||
        !Number.isFinite(final.lineHeightPt) || final.lineHeightPt <= 0) {
      throw new Error(
        `Invalid browser measurement for ${fontFamily}: ` +
        `${JSON.stringify(final)}`
      );
    }

    setCache(cacheKey, final);
    return final;
  } finally {
    await releasePage(page);
  }
}


/**
 * Batch measurement keeps one isolated page alive for an entire pagination
 * section. Each item still waits for the requested font and is measured from
 * the DOM, but the browser/font stylesheet is not rebuilt for every block.
 */
async function measureTextBatch(optionsList) {
  const pending = optionsList.filter((opts) => !getCache(getCacheKey(opts)));
  if (pending.length === 0) return optionsList.map((opts) => getCache(getCacheKey(opts)));

  const page = await acquirePage();
  try {
    const first = pending[0];
    const html = `<!DOCTYPE html><html lang="ar" dir="${first.direction || 'rtl'}"><head><meta charset="UTF-8" /><style>
      @import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');
      body { margin: 0; padding: 0; }
      #measure { white-space: pre-wrap; word-break: normal; overflow-wrap: normal; }
    </style></head><body><div id="measure"></div></body></html>`;
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });

    for (const opts of pending) {
      const key = getCacheKey(opts);
      const result = await page.evaluate(async (requested) => {
        const el = document.getElementById('measure');
        el.textContent = requested.text;
        Object.assign(el.style, {
          fontFamily: `${requested.fontFamily}, serif`,
          fontSize: `${requested.fontSizePt}pt`,
          fontWeight: requested.fontWeight || 'normal',
          lineHeight: String(requested.lineHeight || 1),
          width: `${requested.widthPt}pt`,
          textAlign: requested.textAlign || 'justify',
          direction: requested.direction || 'rtl'
        });
        const fontSpec = `${requested.fontSizePt}pt ${requested.fontFamily}`;
        const loadedFaces = await document.fonts.load(fontSpec, requested.text);
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (loadedFaces.length === 0 || !document.fonts.check(fontSpec, requested.text)) {
          throw new Error(`Required font ${requested.fontFamily} was not loaded`);
        }
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const lineHeightPx = parseFloat(style.lineHeight);
        return {
          widthPx: rect.width,
          heightPx: rect.height,
          lineCount: Math.max(1, Math.round(rect.height / lineHeightPx)),
          lineHeightPx
        };
      }, {
        ...opts,
        widthPt: mmToPt(opts.widthMm)
      });
      const pxToPt = 72 / 96;
      const final = {
        widthPt: result.widthPx * pxToPt,
        heightPt: result.heightPx * pxToPt,
        lineCount: result.lineCount,
        lineHeightPt: result.lineHeightPx * pxToPt,
        measuredWidthPx: result.widthPx,
        measuredHeightPx: result.heightPx
      };
      if (!Number.isFinite(final.heightPt) || final.heightPt <= 0 ||
          !Number.isFinite(final.lineCount) || final.lineCount < 1 ||
          !Number.isFinite(final.lineHeightPt) || final.lineHeightPt <= 0) {
        throw new Error(`Invalid browser measurement for ${opts.fontFamily}: ${JSON.stringify(final)}`);
      }
      setCache(key, final);
    }
    return optionsList.map((opts) => getCache(getCacheKey(opts)));
  } finally {
    await releasePage(page);
  }
}
module.exports = { measureText, measureTextBatch };
