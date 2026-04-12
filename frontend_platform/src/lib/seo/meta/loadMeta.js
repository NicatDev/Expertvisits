import metaAz from './translations/meta-az.json';
import metaEn from './translations/meta-en.json';
import metaRu from './translations/meta-ru.json';

const bundles = { az: metaAz, en: metaEn, ru: metaRu };

/**
 * SEO mətn paketi — hər səhifə üçün eyni struktur (meta-az.json və s.).
 * @param {string} locale az|en|ru
 */
export function getMetaBundle(locale) {
  const key = bundles[locale] ? locale : 'az';
  return bundles[key];
}
