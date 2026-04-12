import HomePageClient from './HomePageClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildListingMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const loc = locale || 'az';
  return buildListingMetadata({
    siteOrigin: SITE_ORIGIN,
    pathname: `/${loc}`,
    locale: loc,
    pageKey: 'home',
  });
}

export default function LocalizedHomePage() {
  return <HomePageClient />;
}
