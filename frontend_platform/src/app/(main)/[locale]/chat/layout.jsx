import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildNoIndexMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const loc = locale || 'az';
  return buildNoIndexMetadata({
    siteOrigin: SITE_ORIGIN,
    pathname: `/${loc}/chat`,
    locale: loc,
    noindexKey: 'chat',
  });
}

export default function ChatLayout({ children }) {
  return children;
}