import { getCompanyCached, getVacancies } from '@/lib/api/company';
import { importHomePageClient } from '@/lib/micrositeImports';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';

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

    const HomePageClient = await importHomePageClient(company);

    return (
        <HomePageClient
            company={company}
            companySlug={companySlug}
            previewVacancies={previewVacancies}
            visibility={visibility}
        />
    );
}
