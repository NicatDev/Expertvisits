import HomePageClient from './HomePageClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildMarketingMetadata } from '@/lib/seo/marketingMetadata';
import az from '@/locales/az.json';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

const siteByLocale = { az: az.site_meta, en: en.site_meta, ru: ru.site_meta };

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = siteByLocale[locale] || siteByLocale.az;
  const pathname = `/${locale}`;
  return buildMarketingMetadata(SITE_ORIGIN, pathname, t, {
    ogImages: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Expert Visits Logo',
      },
    ],
  });
}

export default function LocalizedHomePage() {
  return <HomePageClient />;
}
