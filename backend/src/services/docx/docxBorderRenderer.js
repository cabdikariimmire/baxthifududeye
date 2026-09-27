const {
  Header,
  Paragraph,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType
} = require('docx');
const { getBrowser } = require('../../utils/browserSingleton');
const defaultBorders = require('../document/defaultBorders');
const { getDefaultCoverElements } = require('../document/coverLayout');
const { resolveLogoBase64 } = require('../document/logoResolver');

const borderPngCache = new Map();
const coverPngCache = new Map();

/**
 * Renders the exact SVG border artwork from defaultBorders.js into a high-resolution PNG buffer.
 * Caches the result in memory for optimal performance across multiple page/research exports.
 *
 * @param {Object} border - Border object from defaultBorders.js
 * @returns {Promise<Buffer|null>} PNG buffer or null if no border
 */
async function renderBorderToPngBuffer(border) {
  if (!border || !border.borderId || border.borderId === 'none' || !border.svgPattern) {
    return null;
  }

  const cacheKey = border.borderId;
  if (borderPngCache.has(cacheKey)) {
    return borderPngCache.get(cacheKey);
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 794px;
      height: 1123px;
      overflow: hidden;
      background: transparent;
    }
    svg {
      width: 794px;
      height: 1123px;
      display: block;
    }
  </style>
</head>
<body>
  ${border.svgPattern}
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const pngBuffer = await page.screenshot({ type: 'png', omitBackground: true });
    await page.close();

    borderPngCache.set(cacheKey, pngBuffer);
    return pngBuffer;
  } catch (err) {
    console.warn('[docxBorderRenderer] Could not render SVG border to PNG:', err.message);
    return null;
  }
}

/**
 * Creates a DOCX Header containing the anchored full-page border background image.
 * In WordprocessingML, anchoring this image in the Header with behindDocument=true
 * and relativeFrom=page causes Word to display the exact border on every page of the section.
 *
 * @param {Buffer} pngBuffer - Rendered PNG border buffer
 * @returns {Header} DOCX Header component
 */
function createBorderHeader(pngBuffer) {
  if (!pngBuffer || pngBuffer.length === 0) return null;

  const borderImageRun = new ImageRun({
    data: pngBuffer,
    transformation: {
      width: 793.7, // 210mm in points
      height: 1122.5 // 297mm in points
    },
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.PAGE,
        offset: 0
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PAGE,
        offset: 0
      },
      wrap: {
        type: TextWrappingType.NONE
      },
      behindDocument: true,
      allowOverlap: true,
      lockAnchor: true
    }
  });

  return new Header({
    children: [
      new Paragraph({
        children: [borderImageRun]
      })
    ]
  });
}

/**
 * Renders the Cover Page canvas/layout into a high-resolution full A4 PNG image
 * respecting exact X, Y, width, height, z-index, logo dimensions (without distortion),
 * title badge color, font sizes, and exact SVG border layer.
 *
 * @param {Object} coverData - Cover form/layout data
 * @param {Object} border - Border object
 * @returns {Promise<Buffer|null>} PNG buffer of rendered cover page
 */
async function renderCoverPageToPngBuffer(coverData = {}, border = null) {
  const cacheKey = JSON.stringify(coverData) + '_' + (border?.borderId || 'none');
  if (coverPngCache.has(cacheKey)) {
    return coverPngCache.get(cacheKey);
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    const coverElements = (coverData.coverLayout?.elements && Array.isArray(coverData.coverLayout.elements) && coverData.coverLayout.elements.length > 0)
      ? coverData.coverLayout.elements
      : getDefaultCoverElements(coverData);

    const elementsHtml = coverElements.map((el) => {
      const raw = el.content || (coverData[el.fieldKey || el.id] || '');
      const displayText = raw ? (el.prefix ? `${el.prefix}${raw}` : raw) : '';

      if (el.type === 'image') {
        const logoSrc = resolveLogoBase64(el.source || coverData.logoUrl);
        if (!logoSrc) return '';
        const widthMm = el.width || 35;
        const heightMm = el.height || 35;
        return `
          <div class="pdf-cover-element" style="position: absolute; left: ${el.x}mm; top: ${el.y}mm; width: ${widthMm}mm; height: ${heightMm}mm; z-index: ${el.zIndex || 2}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
            <img src="${logoSrc}" style="width: 100%; height: 100%; object-fit: contain;" alt="شعار الجامعة" />
          </div>
        `;
      }

      if (el.type === 'pill') {
        const titleText = displayText || coverData.title || '';
        if (!titleText) return '';
        const bg = (el.badgeColor || coverData.badgeColor || '#38761d').trim();
        return `
          <div class="pdf-cover-element" style="position: absolute; left: ${el.x}mm; top: ${el.y}mm; width: ${el.width}mm; height: ${el.height ? el.height + 'mm' : 'auto'}; z-index: ${el.zIndex || 3}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
            <div style="background-color: ${bg}; border-radius: 9999px; padding: 6px 24px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.08); box-sizing: border-box;">
              <span style="font-family: 'Amiri', serif; font-size: ${el.fontSize || 20.5}pt; font-weight: bold; color: #111827; text-align: center; direction: rtl; word-break: break-word; line-height: 1.2;">${titleText}</span>
            </div>
          </div>
        `;
      }

      if (!displayText) return '';
      const align = el.textAlign === 'right' ? 'right' : (el.textAlign === 'left' ? 'left' : 'center');
      const justify = el.textAlign === 'right' ? 'flex-start' : (el.textAlign === 'left' ? 'flex-end' : 'center');

      return `
        <div class="pdf-cover-element" style="position: absolute; left: ${el.x}mm; top: ${el.y}mm; width: ${el.width}mm; height: ${el.height ? el.height + 'mm' : 'auto'}; z-index: ${el.zIndex || 1}; display: flex; align-items: center; justify-content: ${justify}; text-align: ${align}; box-sizing: border-box;">
          <span style="font-family: 'Amiri', serif; font-size: ${el.fontSize || 20}pt; font-weight: ${el.fontWeight || 'bold'}; color: ${el.color || '#0f172a'}; width: 100%; direction: rtl; line-height: 1.2;">${displayText}</span>
        </div>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      background: #ffffff;
      position: relative;
    }
    .border-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 210mm;
      height: 297mm;
      pointer-events: none;
      z-index: 1;
    }
    .cover-layer {
      position: absolute;
      inset: 0;
      width: 210mm;
      height: 297mm;
      z-index: 2;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="border-layer">
    ${border && border.svgPattern ? border.svgPattern : ''}
  </div>
  <div class="cover-layer">
    ${elementsHtml}
  </div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 8000 });
    const pngBuffer = await page.screenshot({ type: 'png' });
    await page.close();

    coverPngCache.set(cacheKey, pngBuffer);
    return pngBuffer;
  } catch (err) {
    console.warn('[docxBorderRenderer] Could not render cover page to PNG:', err.message);
    return null;
  }
}

module.exports = {
  renderBorderToPngBuffer,
  createBorderHeader,
  renderCoverPageToPngBuffer
};
