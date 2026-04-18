import { getCompanyCached } from '@/lib/api/company';
import { importContactPageClient } from '@/lib/micrositeImports';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function ContactPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.contact_page) notFound();

    const ContactPageClient = await importContactPageClient(company);

    return (
        <ContactPageClient company={company} companySlug={companySlug} visibility={visibility} />
    );
}
