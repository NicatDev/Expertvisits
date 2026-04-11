import React from 'react';
import { business } from '@/lib/api';
import CompanyDetailClient from './CompanyDetailClient';
import { cookies } from 'next/headers';
import { hreflangAlternatesForPathname, canonicalUrlForPathname } from '@/lib/i18n/seoAlternates';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const cookieStore = await cookies();
  const fallbackLng = cookieStore.get('i18next')?.value || 'az';
  const uiLng = locale || fallbackLng;

  try {
    const res = await business.getCompany(slug);
    const company = res.data;

    let title;
    let description;
    let ogDesc;

    if (uiLng === 'ru') {
      title = `${company.name} | Компания - Expert Visits`;
      description = `Изучите профиль компании ${company.name} на Expert Visits. Узнайте об их услугах, вакансиях и новостях.`;
      ogDesc = `Компания: ${company.name}. Изучите профиль прямо сейчас на Expert Visits!`;
    } else if (uiLng === 'en') {
      title = `${company.name} | Company - Expert Visits`;
      description = `Explore the profile of ${company.name} on Expert Visits. Discover their services, vacancies, and news.`;
      ogDesc = `Company: ${company.name}. Explore their profile now on Expert Visits!`;
    } else {
      title = `${company.name} | Şirkət - Expert Visits`;
      description = `Expert Visits-də ${company.name} şirkətinin profilini kəşf edin. Onların xidmətləri, vakansiyaları və xəbərləri ilə tanış olun.`;
      ogDesc = `Şirkət: ${company.name}. Elə indi Expert Visits-də şirkət profilini kəşf edin!`;
    }

    const pathname = `/${uiLng}/companies/${slug}`;
    const canonical = canonicalUrlForPathname(SITE_ORIGIN, pathname);
    const languagesMap = hreflangAlternatesForPathname(SITE_ORIGIN, pathname);

    return {
      title,
      description,
      alternates: {
        canonical,
        ...(languagesMap ? { languages: languagesMap } : {}),
      },
      openGraph: {
        title,
        description: ogDesc,
        url: canonical,
        images: company.logo ? [company.logo] : [],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: company.logo ? [company.logo] : [],
      },
    };
  } catch (error) {
    return {
      title:
        uiLng === 'az'
          ? 'Şirkət tapılmadı | Expert Visits'
          : uiLng === 'ru'
            ? 'Компания не найдена | Expert Visits'
            : 'Company Not Found | Expert Visits',
      description:
        uiLng === 'az'
          ? 'Axtardığınız şirkət tapılmadı.'
          : uiLng === 'ru'
            ? 'Запрошенная компания не найдена.'
            : 'The requested company could not be found.',
    };
  }
}

export default async function CompanyDetailPageWrapper({ params }) {
  return <CompanyDetailClient params={params} />;
}
