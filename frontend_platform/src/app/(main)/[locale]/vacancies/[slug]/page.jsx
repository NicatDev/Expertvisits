import { notFound } from 'next/navigation';
import { getVacancyBySlug } from '@/lib/api/getVacancyBySlug';
import DetailClient from './DetailClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildVacancyMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata({ params }) {
  const { slug, locale: routeLocale } = await params;
  const loc = routeLocale || 'az';
  const vacancy = await getVacancyBySlug(slug, loc);
  if (!vacancy) {
    return { title: 'Expert Visits', robots: { index: false, follow: false } };
  }
  return buildVacancyMetadata({
    siteOrigin: SITE_ORIGIN,
    vacancy,
    slug,
    routeLocale: loc,
  });
}

export default async function VacancyDetailPage({ params }) {
  const { slug, locale: routeLocale } = await params;
  const vacancy = await getVacancyBySlug(slug, routeLocale || 'az');

  if (!vacancy) {
    notFound();
  }

  return <DetailClient vacancy={vacancy} />;
}
