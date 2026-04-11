'use client';

import { usePathname } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';

/** Locale from /az|/en|/ru prefix; falls back to default when pathname has no prefix. */
export function usePathLocale() {
  const pathname = usePathname();
  return localeFromPathname(pathname) || defaultLocale;
}

/** Prefixes a path without locale (e.g. `/notifications`) with the current route locale. */
export function useLocalizedPath(pathWithoutLocale) {
  const locale = usePathLocale();
  return withLocale(locale, pathWithoutLocale);
}
