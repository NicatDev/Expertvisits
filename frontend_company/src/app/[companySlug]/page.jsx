import { getCompanyCached, getVacancies } from '@/lib/api/company';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import HomePageClient from '@/templates/template1/pages/HomePageClient';

export const revalidate = 60;

export default async function CompanyHomePage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);

    let previewVacancies = [];
    try {
        const v = await getVacancies({ company: company.id, page_size: 6 });
        previewVacancies = v.results || [];
    } catch {
        previewVacancies = [];
    }

    return (
        <HomePageClient
            company={company}
            companySlug={companySlug}
            previewVacancies={previewVacancies}
            visibility={visibility}
        />
    );
}
