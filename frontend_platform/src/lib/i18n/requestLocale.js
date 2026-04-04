import { cookies, headers } from 'next/headers';
import { languages } from '@/i18n/settings';

export async function getRequestLocaleState() {
  const headersList = await headers();
  const cookieStore = await cookies();
  const pathname = headersList.get('x-ev-pathname') || '/';
  const seoLocale = headersList.get('x-ev-seo-locale');
  const cookieRaw = cookieStore.get('i18next')?.value;
  const cookieLng = languages.includes(cookieRaw) ? cookieRaw : 'az';
  const effectiveLng =
    seoLocale === 'en' || seoLocale === 'ru' ? seoLocale : cookieLng;

  return { effectiveLng, pathname };
}
