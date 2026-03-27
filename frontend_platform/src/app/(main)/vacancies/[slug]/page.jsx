
import React from 'react';
import { business } from '@/lib/api';
import DetailClient from './DetailClient';
import { notFound } from 'next/navigation';

import { cookies } from 'next/headers';

// SEO Metadata Generation
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const systemLng = cookieStore.get('i18next')?.value || 'az';

    try {
        const res = await business.getVacancy(slug);
        const vacancy = res.data;
        const companyName = vacancy.company_name || vacancy.company?.name || '';
        
        // Prioritize the detected language of the vacancy
        const vacancyLng = vacancy.language || 'az';
        const localeMap = { az: 'az_AZ', ru: 'ru_RU', en: 'en_US' };

        let title, description;

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
            title: title,
            description: description,
            alternates: {
                canonical: `https://expertvisits.com/vacancies/${slug}/`,
                languages: {
                    [vacancyLng]: `https://expertvisits.com/vacancies/${slug}/`,
                },
            },
            openGraph: {
                title: title,
                description: description,
                images: vacancy.company?.logo ? [{ url: vacancy.company.logo }] : [],
                type: "website",
                locale: localeMap[vacancyLng] || 'az_AZ',
            }
        };
    } catch (error) {
        return {
            title: systemLng === 'az' ? 'Vakansiya tapılmadı | Expert Visits' : (systemLng === 'ru' ? 'Вакансия не найдена | Expert Visits' : 'Vacancy Not Found | Expert Visits'),
        };
    }
}

async function getVacancyData(slug) {
    try {
        const res = await business.getVacancy(slug);
        return res.data;
    } catch (error) {
        return null;
    }
}

export default async function VacancyDetailPage({ params }) {
    const { slug } = await params;
    const vacancy = await getVacancyData(slug);

    if (!vacancy) {
        notFound();
    }

    return (
        <DetailClient vacancy={vacancy} />
    );
}
