import { getCompanyCached } from '@/lib/api/company';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import PartnersPageClient from '@/templates/template1/pages/PartnersPageClient';

export const revalidate = 60;

export default async function PartnersPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.partners_page) notFound();
    return <PartnersPageClient company={company} />;
}
