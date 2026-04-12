import { cookies } from 'next/headers';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildNoIndexMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18next')?.value;
  const locale = ['az', 'en', 'ru'].includes(lng) ? lng : 'az';
  return buildNoIndexMetadata({
    siteOrigin: SITE_ORIGIN,
    pathname: '/login',
    locale,
    noindexKey: 'login',
  });
}

export default function LoginLayout({ children }) {
  return children;
}
