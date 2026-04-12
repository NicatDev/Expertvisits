import {
  defaultLocale,
  localeFromPathname,
  pathnameWithoutLocale,
  withLocale,
} from '@/lib/i18n/routing';

const base = (baseUrl) => baseUrl.replace(/\/$/, '');

/**
 * hreflang cluster for locale-prefixed URLs.
 */
export function hreflangAlternatesForPathname(baseUrl, pathname) {
  const loc = localeFromPathname(pathname || '/');
  if (!loc) return undefined;

  const root = base(baseUrl);
  const rest = pathnameWithoutLocale(pathname || '/');

  const azUrl = `${root}${withLocale('az', rest)}`;
  const enUrl = `${root}${withLocale('en', rest)}`;
  const ruUrl = `${root}${withLocale('ru', rest)}`;

  return {
    az: azUrl,
    en: enUrl,
    ru: ruUrl,
    'x-default': `${root}${withLocale(defaultLocale, rest)}`,
  };
}

export function canonicalUrlForPathname(baseUrl, pathname) {
  const root = base(baseUrl);
  const raw = pathname || '/';
  const pathPart = raw.split('?')[0];
  if (!pathPart || pathPart === '/') return `${root}/`;
  return `${root}${pathPart.startsWith('/') ? pathPart : `/${pathPart}`}`;
}
