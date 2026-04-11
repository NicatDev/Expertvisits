import { hreflangAlternatesForPathname, canonicalUrlForPathname } from '@/lib/i18n/seoAlternates';

/**
 * Shared Next.js metadata object for localized marketing pages (home, listings).
 * `t` must include title, description, keywords, og_locale.
 */
export function buildMarketingMetadata(siteOrigin, pathname, t, options = {}) {
  const { siteName = 'Expert Visits', twitterImages = ['/logo.png'], ogImages } = options;
  const canonical = canonicalUrlForPathname(siteOrigin, pathname);
  const languagesMap = hreflangAlternatesForPathname(siteOrigin, pathname);

  const defaultOgImages = [
    {
      url: '/logo.png',
      width: 800,
      height: 600,
      alt: 'Expert Visits Logo',
    },
  ];

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    alternates: {
      canonical,
      ...(languagesMap ? { languages: languagesMap } : {}),
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: canonical,
      siteName,
      images: ogImages || defaultOgImages,
      locale: t.og_locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.description,
      images: twitterImages,
    },
  };
}
