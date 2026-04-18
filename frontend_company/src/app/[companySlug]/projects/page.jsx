import { getCompanyCached } from '@/lib/api/company';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import ProjectsPageClient from '@/templates/template1/pages/ProjectsPageClient';

export const revalidate = 60;

export default async function ProjectsPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.projects_page) notFound();
    return <ProjectsPageClient company={company} />;
}
