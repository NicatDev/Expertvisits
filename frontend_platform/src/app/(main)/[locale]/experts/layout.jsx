import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildMarketingMetadata } from '@/lib/seo/marketingMetadata';
import az from '@/locales/az.json';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

const pageByLocale = { az: az.page_meta, en: en.page_meta, ru: ru.page_meta };

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const bundle = pageByLocale[locale] || pageByLocale.az;
  const t = bundle.experts;
  const pathname = `/${locale}/experts`;
  return buildMarketingMetadata(SITE_ORIGIN, pathname, t);
}

export default function ExpertsLayout({ children }) {
  return <>{children}</>;
}
