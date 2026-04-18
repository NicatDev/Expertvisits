import { getCompanyCached } from '@/lib/api/company';
import { importAboutPageClient } from '@/lib/micrositeImports';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function AboutPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.about_page) notFound();
    const AboutPageClient = await importAboutPageClient(company);
    return <AboutPageClient company={company} />;
}
