import React from 'react';
import { business } from '@/lib/api';
import CompanyDetailClient from './CompanyDetailClient';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

// SEO Metadata Generation
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const lng = cookieStore.get('i18next')?.value || 'en';

    try {
        const res = await business.getCompany(slug); // Ensure API supports slug lookup
        const company = res.data;

        let title, description, ogDesc;

        if (lng === 'ru') {
            title = `${company.name} | Компания - Expert Visits`;
            description = `Изучите профиль компании ${company.name} на Expert Visits. Узнайте об их услугах, вакансиях и новостях.`;
            ogDesc = `Компания: ${company.name}. Изучите профиль прямо сейчас на Expert Visits!`;
        } else if (lng === 'en') {
            title = `${company.name} | Company - Expert Visits`;
            description = `Explore the profile of ${company.name} on Expert Visits. Discover their services, vacancies, and news.`;
            ogDesc = `Company: ${company.name}. Explore their profile now on Expert Visits!`;
        } else {
            // Default to 'az'
            title = `${company.name} | Şirkət - Expert Visits`;
            description = `Expert Visits-də ${company.name} şirkətinin profilini kəşf edin. Onların xidmətləri, vakansiyaları və xəbərləri ilə tanış olun.`;
            ogDesc = `Şirkət: ${company.name}. Elə indi Expert Visits-də şirkət profilini kəşf edin!`;
        }

        return {
            title: title,
            description: description,
            openGraph: {
                title: title,
                description: ogDesc,
                images: company.logo ? [company.logo] : [],
                type: "profile"
            }
        };
    } catch (error) {
        return {
            title: lng === 'az' ? 'Şirkət tapılmadı | Expert Visits' : (lng === 'ru' ? 'Компания не найдена | Expert Visits' : 'Company Not Found | Expert Visits'),
            description: lng === 'az' ? 'Axtardığınız şirkət tapılmadı.' : (lng === 'ru' ? 'Запрошенная компания не найдена.' : 'The requested company could not be found.')
        };
    }
}

async function getCompanyData(slug) {
    // Client already fetches, but we might want to pre-fetch later
    // Let's just return slug and let Client fetch, or we can fetch here.
    // Given the client component already fetches by ID or slug in useEffect:
    return slug;
}

export default async function CompanyDetailPageWrapper({ params }) {
    const { slug } = await params;
    
    return (
        <CompanyDetailClient params={params} />
    );
}
