import ProfileLayoutClient from './ProfileLayoutClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildNoIndexMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const loc = locale || 'az';
  return buildNoIndexMetadata({
    siteOrigin: SITE_ORIGIN,
    pathname: `/${loc}/profile`,
    locale: loc,
    noindexKey: 'profile',
  });
}

export default function ProfileSegmentLayout({ children }) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
