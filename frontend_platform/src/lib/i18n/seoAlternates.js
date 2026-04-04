const base = (baseUrl) => baseUrl.replace(/\/$/, '');

/**
 * hreflang map for SEO locale page families; undefined when not a known cluster.
 */
export function hreflangAlternatesForPathname(baseUrl, pathname) {
  const root = base(baseUrl);
  const parts = (pathname || '/').split('/').filter(Boolean);

  if (parts.length === 0) {
    return {
      az: `${root}/`,
      en: `${root}/en`,
      ru: `${root}/ru`,
      'x-default': `${root}/`,
    };
  }

  const [a, b, c] = parts;

  if (parts.length === 1 && (a === 'en' || a === 'ru')) {
    return {
      az: `${root}/`,
      en: `${root}/en`,
      ru: `${root}/ru`,
      'x-default': `${root}/`,
    };
  }

  if ((a === 'en' || a === 'ru') && b === 'vacancies' && !c) {
    return {
      az: `${root}/vacancies`,
      en: `${root}/vacancies/en`,
      ru: `${root}/vacancies/ru`,
      'x-default': `${root}/vacancies`,
    };
  }

  if (a === 'experts' && parts.length === 1) {
    return {
      az: `${root}/experts`,
      en: `${root}/experts/en`,
      ru: `${root}/experts/ru`,
      'x-default': `${root}/experts`,
    };
  }

  if (a === 'experts' && parts.length === 2 && (b === 'en' || b === 'ru')) {
    return {
      az: `${root}/experts`,
      en: `${root}/experts/en`,
      ru: `${root}/experts/ru`,
      'x-default': `${root}/experts`,
    };
  }

  if (a === 'vacancies' && parts.length === 1) {
    return {
      az: `${root}/vacancies`,
      en: `${root}/vacancies/en`,
      ru: `${root}/vacancies/ru`,
      'x-default': `${root}/vacancies`,
    };
  }

  if (a === 'vacancies' && parts.length === 2 && (b === 'en' || b === 'ru')) {
    return {
      az: `${root}/vacancies`,
      en: `${root}/vacancies/en`,
      ru: `${root}/vacancies/ru`,
      'x-default': `${root}/vacancies`,
    };
  }

  if (a === 'companies' && parts.length === 1) {
    return {
      az: `${root}/companies`,
      en: `${root}/companies/en`,
      ru: `${root}/companies/ru`,
      'x-default': `${root}/companies`,
    };
  }

  if (a === 'companies' && parts.length === 2 && (b === 'en' || b === 'ru')) {
    return {
      az: `${root}/companies`,
      en: `${root}/companies/en`,
      ru: `${root}/companies/ru`,
      'x-default': `${root}/companies`,
    };
  }

  return undefined;
}

export function canonicalUrlForPathname(baseUrl, pathname) {
  const root = base(baseUrl);
  const p = pathname || '/';
  if (p === '/') return `${root}/`;
  return `${root}${p.startsWith('/') ? p : `/${p}`}`;
}
