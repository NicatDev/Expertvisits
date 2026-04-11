/** Route-based i18n: all public marketing URLs live under /az, /en, /ru */

export const locales = ['az', 'en', 'ru'];
export const defaultLocale = 'az';

export function isValidLocale(segment) {
  return typeof segment === 'string' && locales.includes(segment);
}

/**
 * Returns locale from first path segment, or null for non-localized routes (/login, auth, …).
 */
export function localeFromPathname(pathname) {
  if (!pathname || pathname === '/') return null;
  const first = pathname.split('/').filter(Boolean)[0];
  return isValidLocale(first) ? first : null;
}

/**
 * Strips /{locale} prefix. /az/experts → /experts, /az → /
 */
export function pathnameWithoutLocale(pathname) {
  if (!pathname || pathname === '/') return '/';
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return '/';
  if (isValidLocale(parts[0])) {
    const rest = parts.slice(1);
    if (!rest.length) return '/';
    return `/${rest.join('/')}`;
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

/**
 * @param {string} locale - az|en|ru
 * @param {string} pathWithoutLocale - e.g. /experts or experts or /
 */
export function withLocale(locale, pathWithoutLocale) {
  const raw = pathWithoutLocale || '/';
  const normalized =
    raw === '/' ? '' : (raw.startsWith('/') ? raw : `/${raw}`);
  return `/${locale}${normalized}`;
}

/**
 * /az/experts → /en/experts. Non-localized paths unchanged (caller updates cookie only).
 */
export function swapLocaleInPathname(pathname, newLocale) {
  if (!pathname) return `/${newLocale}`;
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && isValidLocale(parts[0])) {
    parts[0] = newLocale;
    return `/${parts.join('/')}`;
  }
  return pathname;
}
