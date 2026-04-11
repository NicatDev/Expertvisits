import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, localeFromPathname } from '@/lib/i18n/routing';

export async function getRequestLocaleState() {
  const headersList = await headers();
  const cookieStore = await cookies();
  const pathname = headersList.get('x-ev-pathname') || '/';

  const pathLocale = localeFromPathname(pathname);
  const cookieRaw = cookieStore.get('i18next')?.value;
  const cookieLng = locales.includes(cookieRaw) ? cookieRaw : defaultLocale;
  const effectiveLng = pathLocale || cookieLng;

  return { effectiveLng, pathname };
}
