import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/routing';

export default async function LocaleSegmentLayout({ children, params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }
  return children;
}
