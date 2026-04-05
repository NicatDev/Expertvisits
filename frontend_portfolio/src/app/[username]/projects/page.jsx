import { getUser } from '@/lib/api/portfolio';
import { getTemplateProjects } from '@/templates';
import { notFound } from 'next/navigation';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';

export const revalidate = 0;

export default async function UserProjectsPage({ params }) {
    const { username } = await params;
    let user;
    try {
        user = await getUser(username);
    } catch {
        return notFound();
    }
    if (!user) return notFound();
    const v = mergeSectionVisibility(user.section_visibility);
    if (!v.projects_page) return notFound();
    const TemplateProjects = getTemplateProjects(user.template_id);
    return <TemplateProjects user={user} />;
}
