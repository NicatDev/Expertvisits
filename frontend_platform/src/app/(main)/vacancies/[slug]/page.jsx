
import React from 'react';
import { business } from '@/lib/api';
import DetailClient from './DetailClient';
import { notFound } from 'next/navigation';

// SEO Metadata Generation
export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const res = await business.getVacancy(slug); // Ensure API supports slug lookup
        const vacancy = res.data;

        return {
            title: `${vacancy.title} at ${vacancy.company_name || vacancy.company?.name} | Expert Visits`,
            description: `Apply for ${vacancy.title} in ${vacancy.location}. ${vacancy.job_type} - ${vacancy.work_mode}.`,
            openGraph: {
                title: `${vacancy.title} - ${vacancy.company_name || vacancy.company?.name}`,
                description: `Looking for a ${vacancy.title}? Apply now on Expert Visits!`,
                // images: [vacancy.company?.logo || '/default-company.png'],
            }
        };
    } catch (error) {
        return {
            title: 'Vacancy Not Found | Expert Visits',
            description: 'The requested vacancy could not be found.'
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
