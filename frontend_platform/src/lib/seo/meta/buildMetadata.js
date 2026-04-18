import { hreflangAlternatesForPathname, canonicalUrlForPathname } from '@/lib/i18n/seoAlternates';
import { getMetaBundle } from './loadMeta';

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, maxLen = 160) {
  if (!text || text.length <= maxLen) return text;
  return `${text.substring(0, maxLen - 3).trimEnd()}...`;
}

function absoluteUrl(siteOrigin, pathOrUrl) {
  const origin = siteOrigin.replace(/\/$/, '');
  if (!pathOrUrl) return `${origin}/logo.png`;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

const localeOg = { az: 'az_AZ', en: 'en_US', ru: 'ru_RU' };

/**
 * Ana səhifə, ekspertlər, vakansiyalar, şirkətlər siyahıları — index + canonical + hreflang + OG + Twitter
 */
export function buildListingMetadata({ siteOrigin, pathname, locale, pageKey }) {
  const t = getMetaBundle(locale);
  const p = t.pages[pageKey];
  if (!p) {
    throw new Error(`buildListingMetadata: unknown pageKey "${pageKey}"`);
  }
  const canonical = canonicalUrlForPathname(siteOrigin, pathname);
  const languages = hreflangAlternatesForPathname(siteOrigin, pathname);
  const imgPath = t.ogImageDefault.startsWith('/') ? t.ogImageDefault : `/${t.ogImageDefault}`;

  return {
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    alternates: {
      canonical,
      ...(languages ? { languages } : {}),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: p.title,
      description: p.description,
      url: canonical,
      siteName: t.siteName,
      locale: p.ogLocale,
      type: 'website',
      images: [
        {
          url: imgPath,
          width: 800,
          height: 600,
          alt: t.siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: p.title,
      description: p.description,
      images: [imgPath],
    },
  };
}

/**
 * Məqalə — yalnız məzmun dili = route dili olduqda index; canonical həmişə məzmun dilindəki URL
 */
export function buildArticleMetadata({ siteOrigin, article, slug, routeLocale }) {
  const contentLng = article.language || 'az';
  const t = getMetaBundle(contentLng);
  const suffix = t.article?.titleSuffix || '| Expert Visits';
  const title = `${article.title} ${suffix}`.trim();
  const cleanBody = stripHtml(article.body);
  const description = truncate(cleanBody, 160) || article.title;
  const canonicalPath = `/${contentLng}/article/${slug}`;
  const canonical = canonicalUrlForPathname(siteOrigin, canonicalPath);
  const isIndexed = routeLocale === contentLng;
  const ogImageRaw = article.image || t.ogImageDefault;
  const ogImage = absoluteUrl(siteOrigin, ogImageRaw);
  const tw = t.article?.twitterSite || '@expertvisits';

  return {
    title,
    description,
    authors: [{ name: article.author || t.siteName }],
    alternates: { canonical },
    robots: isIndexed
      ? {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        }
      : { index: false, follow: true },
    openGraph: {
      title: article.title,
      description,
      url: canonical,
      siteName: t.siteName,
      type: 'article',
      locale: localeOg[contentLng] || 'az_AZ',
      publishedTime: article.created_at,
      modifiedTime: article.updated_at || article.created_at,
      images: [
        {
          url: ogImage,
          width: article.image ? 1200 : 800,
          height: article.image ? 630 : 600,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: article.image ? 'summary_large_image' : 'summary_large_image',
      title: article.title,
      description,
      images: [ogImage],
      site: tw,
    },
  };
}

/**
 * Vakansiya — eyni məntiq (language sahəsi)
 */
export function buildVacancyMetadata({ siteOrigin, vacancy, slug, routeLocale }) {
  const vacancyLng = vacancy.language || 'az';
  const t = getMetaBundle(vacancyLng);
  const companyName =
    vacancy.company_name || vacancy.publisher?.name || vacancy.company?.name || '';
  const suffix = t.vacancy?.titleSuffix || '— Expert Visits';

  let title;
  let description;
  if (vacancyLng === 'ru') {
    title = `${vacancy.title} | ${companyName} | Вакансия ${suffix}`;
    description = `Подайте заявку на должность ${vacancy.title} в ${companyName}. Локация: ${vacancy.location}.`;
  } else if (vacancyLng === 'en') {
    title = `${vacancy.title} | ${companyName} | Job ${suffix}`;
    description = `Apply for ${vacancy.title} at ${companyName}. Location: ${vacancy.location}.`;
  } else {
    title = `${vacancy.title} | ${companyName} | Vakansiya ${suffix}`;
    description = `${companyName} üzrə ${vacancy.title} vəzifəsi. İş yeri: ${vacancy.location}.`;
  }

  const canonicalPath = `/${vacancyLng}/vacancies/${slug}`;
  const canonical = canonicalUrlForPathname(siteOrigin, canonicalPath);
  const isIndexed = routeLocale === vacancyLng;
  const rawLogo = vacancy.publisher?.logo || vacancy.company?.logo;
  let logoUrl =
    typeof rawLogo === 'string'
      ? rawLogo
      : rawLogo && typeof rawLogo === 'object'
        ? rawLogo.url || rawLogo.image || rawLogo.src
        : '';
  if (logoUrl && !logoUrl.startsWith('http')) {
    logoUrl = absoluteUrl(siteOrigin, logoUrl);
  }
  if (!logoUrl) {
    logoUrl = absoluteUrl(siteOrigin, t.ogImageDefault);
  }

  return {
    title,
    description,
    alternates: { canonical },
    robots: isIndexed ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: t.siteName,
      type: 'website',
      locale: localeOg[vacancyLng] || 'az_AZ',
      images: [{ url: logoUrl, alt: companyName || title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [logoUrl],
    },
  };
}

/**
 * Quiz (test) detalı — noindex; title/description/OG struktur məqalə/vakansiya ilə uyğun
 */
export function buildQuizMetadata({ siteOrigin, quiz, slug, routeLocale }) {
  const t = getMetaBundle(routeLocale);
  const nd = t.noindex?.quiz_detail || {};
  const suffix = nd.titleSuffix || '| Expert Visits';
  const title = `${quiz?.title || 'Quiz'} ${suffix}`.trim();
  const n = quiz?.questions?.length ?? 0;
  const rawDesc = (nd.description || '{title} — Expert Visits.').replace(/\{title\}/g, quiz?.title || '').replace(/\{count\}/g, String(n));
  const description = truncate(rawDesc, 160);
  const canonicalPath = `/${routeLocale}/quiz/${slug}`;
  const canonical = canonicalUrlForPathname(siteOrigin, canonicalPath);
  const imgPath = t.ogImageDefault.startsWith('/') ? t.ogImageDefault : `/${t.ogImageDefault}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: t.siteName,
      type: 'website',
      locale: t.pages?.home?.ogLocale || localeOg[routeLocale] || 'az_AZ',
      images: [{ url: imgPath, width: 800, height: 600, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imgPath],
    },
  };
}

/**
 * Şirkət detalı (platform /[locale]/companies/[slug]) — noindex; açıq ünvan mikrosaytdır (/c/…).
 */
export function buildCompanyDetailMetadata({ siteOrigin, company, slug, locale }) {
  const t = getMetaBundle(locale);
  const name = company?.name || 'Company';
  const suffix = t.companyDetail?.titleSuffix || '| Expert Visits';
  const title = `${name} ${suffix}`.trim();
  const description = (t.companyDetail?.description || '{{name}} — Expert Visits').replace(
    /\{\{name\}\}/g,
    name,
  );
  const pathname = `/${locale}/companies/${slug}`;
  const canonical = canonicalUrlForPathname(siteOrigin, pathname);
  const languages = hreflangAlternatesForPathname(siteOrigin, pathname);
  const img = company?.logo ? absoluteUrl(siteOrigin, company.logo) : absoluteUrl(siteOrigin, t.ogImageDefault);

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(languages ? { languages } : {}),
    },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: t.siteName,
      type: 'website',
      locale: t.pages?.companies?.ogLocale || localeOg[locale],
      images: [{ url: img }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [img],
    },
  };
}

/**
 * noindex səhifələr — login, register, profil, chat, user və s.
 */
export function buildNoIndexMetadata({ siteOrigin, pathname, locale, noindexKey, title, description, ogImage }) {
  const t = getMetaBundle(locale);
  const block = t.noindex?.[noindexKey];
  const finalTitle = title || block?.title || t.siteName;
  const finalDesc = description || block?.description || '';
  const canonical = canonicalUrlForPathname(siteOrigin, pathname);
  const rawImg = ogImage || t.ogImageDefault;
  const imgPath = rawImg.startsWith('http') ? rawImg : absoluteUrl(siteOrigin, rawImg);
  const twImg = imgPath;

  return {
    title: finalTitle,
    description: finalDesc,
    alternates: { canonical },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: false },
    },
    openGraph: {
      title: finalTitle,
      description: finalDesc,
      url: canonical,
      siteName: t.siteName,
      type: 'website',
      images: [{ url: imgPath, alt: finalTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDesc,
      images: [twImg],
    },
  };
}

export { absoluteUrl, stripHtml, truncate };

