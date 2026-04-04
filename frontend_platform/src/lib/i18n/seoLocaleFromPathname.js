const SEO_LANGS = new Set(['en', 'ru']);

/**
 * Returns en|ru when the URL path is an SEO locale route; otherwise null.
 * Unprefixed routes (/, /experts, /vacancies) use cookie / default instead.
 */
export function seoLocaleFromPathname(pathname) {
  if (!pathname || pathname === '/') return null;
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const [a, b] = parts;

  if (SEO_LANGS.has(a)) return a;
  if ((a === 'experts' || a === 'vacancies' || a === 'companies') && b && SEO_LANGS.has(b)) {
    return b;
  }

  return null;
}
