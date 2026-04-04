const MARKETING_LOCALES = new Set(['az', 'en', 'ru']);

/**
 * Marketing landing routes: /u/az, /u/en, /u/ru (pathname inside app after basePath strip).
 */
export function seoLocaleFromPathname(appPathname) {
  if (!appPathname || appPathname === '/') return null;
  const parts = appPathname.split('/').filter(Boolean);
  if (parts.length === 1 && MARKETING_LOCALES.has(parts[0])) {
    return parts[0];
  }
  return null;
}
