import { getCompanyCached, getVacancies } from '@/lib/api/company';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import VacanciesPageClient from '@/templates/template1/pages/VacanciesPageClient';

export const revalidate = 60;

export default async function VacanciesPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.vacancies_page) notFound();

    let vacancies = { results: [] };
    try {
        vacancies = await getVacancies({ company: company.id, page_size: 50 });
    } catch {
        vacancies = { results: [] };
    }

    return <VacanciesPageClient vacancies={vacancies} companySlug={companySlug} />;
}
