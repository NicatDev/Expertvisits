import { getCompanyCached } from '@/lib/api/company';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import AboutPageClient from '@/templates/template1/pages/AboutPageClient';

export const revalidate = 60;

export default async function AboutPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.about_page) notFound();
    return <AboutPageClient company={company} />;
}
