import { getUser } from '@/lib/api/portfolio';
import { getTemplateServices } from '@/templates';
import { notFound } from 'next/navigation';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';

export const revalidate = 0;

export default async function UserServicesPage({ params }) {
    const { username } = await params;
    let user;
    try {
        user = await getUser(username);
    } catch {
        return notFound();
    }
    if (!user) return notFound();
    const v = mergeSectionVisibility(user.section_visibility);
    if (!v.services_page) return notFound();
    const TemplateServices = getTemplateServices(user.template_id);
    return <TemplateServices user={user} />;
}
