
import React from 'react';
import { business } from '@/lib/api';
import DetailClient from './DetailClient';
import { notFound } from 'next/navigation';

import { cookies } from 'next/headers';

// SEO Metadata Generation
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const lng = cookieStore.get('i18next')?.value || 'en';

    try {
        const res = await business.getVacancy(slug); // Ensure API supports slug lookup
        const vacancy = res.data;
        const companyName = vacancy.company_name || vacancy.company?.name || '';

        let title, description, ogDesc;

        if (lng === 'ru') {
            title = `${vacancy.title} | ${companyName} | Вакансия - Expert Visits`;
            description = `Подайте заявку на должность ${vacancy.title} в ${companyName}. Локация: ${vacancy.location}.`;
            ogDesc = `Новая вакансия: ${vacancy.title}. Подайте заявку прямо сейчас на Expert Visits!`;
        } else if (lng === 'en') {
            title = `${vacancy.title} | ${companyName} | Job Vacancy - Expert Visits`;
            description = `Apply for the ${vacancy.title} position at ${companyName} in ${vacancy.location}.`;
            ogDesc = `New vacancy: ${vacancy.title}. Apply now on Expert Visits!`;
        } else {
            // Default to 'az'
            title = `${vacancy.title} | ${companyName} | Vakansiya - Expert Visits`;
            description = `${companyName} şirkətində ${vacancy.title} vəzifəsinə müraciət edin. İş yeri: ${vacancy.location}.`;
            ogDesc = `Yeni vakansiya: ${vacancy.title}. Elə indi Expert Visits-də müraciət edin!`;
        }

        return {
            title: title,
            description: description,
            openGraph: {
                title: title,
                description: ogDesc,
                images: vacancy.company?.logo ? [vacancy.company.logo] : [],
                type: "website"
            }
        };
    } catch (error) {
        return {
            title: lng === 'az' ? 'Vakansiya tapılmadı | Expert Visits' : (lng === 'ru' ? 'Вакансия не найдена | Expert Visits' : 'Vacancy Not Found | Expert Visits'),
            description: lng === 'az' ? 'Axtardığınız vakansiya tapılmadı.' : (lng === 'ru' ? 'Запрошенная вакансия не найдена.' : 'The requested vacancy could not be found.')
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
