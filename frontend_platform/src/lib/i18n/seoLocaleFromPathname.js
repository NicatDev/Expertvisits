import { localeFromPathname } from '@/lib/i18n/routing';

/**
 * Locale derived from URL (first segment). Used by middleware for x-ev headers.
 * Returns null for non-localized routes.
 */
export function seoLocaleFromPathname(pathname) {
  return localeFromPathname(pathname);
}
