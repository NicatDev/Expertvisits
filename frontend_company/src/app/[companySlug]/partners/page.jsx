import { getCompanyCached } from '@/lib/api/company';
import { importPartnersPageClient } from '@/lib/micrositeImports';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function PartnersPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.partners_page) notFound();
    const PartnersPageClient = await importPartnersPageClient(company);
    return <PartnersPageClient company={company} />;
}
