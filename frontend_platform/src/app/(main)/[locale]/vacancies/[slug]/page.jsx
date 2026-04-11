import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { getVacancyBySlug } from '@/lib/api/getVacancyBySlug';
import DetailClient from './DetailClient';

export async function generateMetadata({ params }) {
  const { slug, locale: routeLocale } = await params;
  const cookieStore = await cookies();
  const systemLng = cookieStore.get('i18next')?.value || 'az';
  const lng = routeLocale || systemLng;

  const vacancy = await getVacancyBySlug(slug, lng);

  if (!vacancy) {
    notFound();
  }

  const companyName = vacancy.company_name || vacancy.publisher?.name || vacancy.company?.name || '';
  const vacancyLng = vacancy.language || 'az';
  const localeMap = { az: 'az_AZ', ru: 'ru_RU', en: 'en_US' };
  const canonicalUrl = `${SITE_ORIGIN}/${vacancyLng}/vacancies/${slug}`;
  const isIndexedLocale = routeLocale === vacancyLng;

  let title;
  let description;

  if (vacancyLng === 'ru') {
    title = `${vacancy.title} | ${companyName} | Вакансия - Expert Visits`;
    description = `Подайте заявку на должность ${vacancy.title} в ${companyName}. Локация: ${vacancy.location}.`;
  } else if (vacancyLng === 'en') {
    title = `${vacancy.title} | ${companyName} | Job Vacancy - Expert Visits`;
    description = `Apply for the ${vacancy.title} position at ${companyName} in ${vacancy.location}.`;
  } else {
    title = `${vacancy.title} | ${companyName} | Vakansiya - Expert Visits`;
    description = `${companyName} şirkətində ${vacancy.title} vəzifəsinə müraciət edin. İş yeri: ${vacancy.location}.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: vacancy.publisher?.logo || vacancy.company?.logo
        ? [{ url: vacancy.publisher?.logo || vacancy.company?.logo }]
        : [],
      type: 'website',
      locale: localeMap[vacancyLng] || 'az_AZ',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: isIndexedLocale
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function VacancyDetailPage({ params }) {
  const { slug, locale: routeLocale } = await params;
  const vacancy = await getVacancyBySlug(slug, routeLocale || 'az');

  if (!vacancy) {
    notFound();
  }

  return <DetailClient vacancy={vacancy} />;
}
