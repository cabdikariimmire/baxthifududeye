const path = require('path');
const fs = require('fs');

const DEFAULT_LOGO_URL = '/uploads/default_university_logo.png';
const DEFAULT_LOGO_FILE_PATH = path.resolve(__dirname, '../../../uploads/default_university_logo.png');

/**
 * Returns true if the logo is a user-uploaded / custom logo.
 * Returns false if null, undefined, empty, 'none', or pointing to the default university logo asset.
 * @param {string|null|undefined} logoUrl
 * @returns {boolean}
 */
function isCustomLogo(logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string') return false;
  const clean = logoUrl.trim();
  if (!clean || clean === 'none') return false;
  if (clean.includes('default_university_logo.png')) return false;
  return true;
}

/**
 * Authoritative URL resolver:
 * if user has a saved custom logo -> use custom logo
 * else -> use default university logo
 * @param {string|null|undefined} logoUrl
 * @returns {string}
 */
function resolveLogoUrl(logoUrl) {
  if (isCustomLogo(logoUrl)) {
    return logoUrl.trim();
  }
  return DEFAULT_LOGO_URL;
}

/**
 * Resolves the physical file path for the logo on disk.
 * Falls back to DEFAULT_LOGO_FILE_PATH if file not found or if default logo.
 * @param {string|null|undefined} logoUrl
 * @returns {string|null}
 */
function resolveLogoFilePath(logoUrl) {
  if (isCustomLogo(logoUrl)) {
    const cleanUrl = logoUrl.trim();
    // Data URL cannot be resolved to a disk file path
    if (cleanUrl.startsWith('data:image/')) {
      return null;
    }
    if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
      const subPath = cleanUrl.replace(/^\//, '');
      const fullPath = path.resolve(__dirname, '../../..', subPath);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    } else if (fs.existsSync(cleanUrl)) {
      return cleanUrl;
    }
  }

  // Fallback to default university logo file
  if (fs.existsSync(DEFAULT_LOGO_FILE_PATH)) {
    return DEFAULT_LOGO_FILE_PATH;
  }
  return null;
}

/**
 * Resolves the logo to a Buffer and file extension, suitable for DOCX ImageRun.
 * @param {string|null|undefined} logoUrl
 * @returns {{ buffer: Buffer|null, ext: string }}
 */
function resolveLogoBuffer(logoUrl) {
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('data:image/')) {
    try {
      const parts = logoUrl.split(';base64,');
      const extMatch = parts[0].match(/data:image\/([a-zA-Z0-9+]+)/);
      const ext = extMatch ? extMatch[1] : 'png';
      const buffer = Buffer.from(parts[1], 'base64');
      return { buffer, ext };
    } catch (err) {
      console.warn('[LogoResolver] Error parsing data URL:', err.message);
    }
  }

  const filePath = resolveLogoFilePath(logoUrl);
  if (filePath && fs.existsSync(filePath)) {
    try {
      const ext = path.extname(filePath).replace('.', '') || 'png';
      const buffer = fs.readFileSync(filePath);
      return { buffer, ext };
    } catch (err) {
      console.warn('[LogoResolver] Error reading logo file:', filePath, err.message);
    }
  }

  return { buffer: null, ext: 'png' };
}

/**
 * Resolves the logo to a base64 data URI string, suitable for HTML/PDF rendering.
 * @param {string|null|undefined} logoUrl
 * @returns {string}
 */
function resolveLogoBase64(logoUrl) {
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('data:image/')) {
    return logoUrl;
  }

  const { buffer, ext } = resolveLogoBuffer(logoUrl);
  if (buffer && buffer.length > 0) {
    const mimeExt = ext === 'svg' ? 'svg+xml' : ext;
    return `data:image/${mimeExt};base64,${buffer.toString('base64')}`;
  }

  return '';
}

module.exports = {
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_FILE_PATH,
  isCustomLogo,
  resolveLogoUrl,
  resolveLogoFilePath,
  resolveLogoBuffer,
  resolveLogoBase64
};
