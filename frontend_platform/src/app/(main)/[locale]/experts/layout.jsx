import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildListingMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const loc = locale || 'az';
  return buildListingMetadata({
    siteOrigin: SITE_ORIGIN,
    pathname: `/${loc}/experts`,
    locale: loc,
    pageKey: 'experts',
  });
}

export default function ExpertsLayout({ children }) {
  return <>{children}</>;
}
