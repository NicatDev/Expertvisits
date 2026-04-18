import { getCompanyCached } from '@/lib/api/company';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import ContactPageClient from '@/templates/template1/pages/ContactPageClient';

export const revalidate = 60;

export default async function ContactPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.contact_page) notFound();

    return (
        <ContactPageClient company={company} companySlug={companySlug} visibility={visibility} />
    );
}
