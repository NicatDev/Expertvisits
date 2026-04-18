import { getCompanyCached } from '@/lib/api/company';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import ServicesPageClient from '@/templates/template1/pages/ServicesPageClient';

export const revalidate = 60;

export default async function ServicesPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.services_page) notFound();
    return <ServicesPageClient company={company} />;
}
