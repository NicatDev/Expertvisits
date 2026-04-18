import { getCompanyCached } from '@/lib/api/company';
import { importProjectsPageClient } from '@/lib/micrositeImports';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function ProjectsPage({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    if (!company) notFound();
    const visibility = requireActiveCompanyMicrosite(company);
    if (!visibility.projects_page) notFound();
    const ProjectsPageClient = await importProjectsPageClient(company);
    return <ProjectsPageClient company={company} />;
}
