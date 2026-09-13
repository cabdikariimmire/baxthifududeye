export const DEFAULT_LOGO_URL = '/uploads/default_university_logo.png';
export const DEFAULT_UNIVERSITY_LOGO = '/uploads/default_university_logo.png';

/**
 * Checks whether a given logo URL represents a custom user-uploaded logo.
 * Returns false if null, undefined, empty, 'none', or matching the default university logo.
 * @param {string|null|undefined} logoUrl
 * @returns {boolean}
 */
export function isCustomLogo(logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string') return false;
  const clean = logoUrl.trim();
  if (!clean || clean === 'none') return false;
  if (clean.includes('default_university_logo.png')) return false;
  return true;
}

/**
 * Authoritative Logo Resolver:
 * if user has a saved custom logo -> use custom logo
 * else -> use default university logo
 * @param {string|null|undefined} logoUrl
 * @returns {string}
 */
export function resolveLogoUrl(logoUrl) {
  if (isCustomLogo(logoUrl)) {
    return logoUrl.trim();
  }
  return DEFAULT_LOGO_URL;
}
