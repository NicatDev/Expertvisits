import { getUser } from "@/lib/api/portfolio";
import { getTemplateLayout } from "@/templates";
import { notFound } from "next/navigation";

import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
    const { username } = await params;
    const cookieStore = await cookies();
    const lng = cookieStore.get('i18next')?.value || 'en';

    try {
        const resUser = await getUser(username);
        if (!resUser) {
            return { title: lng === 'az' ? 'Portfel tapılmadı' : (lng === 'ru' ? 'Портфолио не найдено' : 'Portfolio Not Found') };
        }
        
        const profile = resUser.user || {};
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || username;
        const suffix = 'Expert Visits';
        const defaultDesc = lng === 'az' ? `${fullName}-in rəsmi şəxsi portfeli.` : (lng === 'ru' ? `Официальное персональное портфолио ${fullName}.` : `Official personal portfolio of ${fullName}.`);

        return {
            title: `${fullName} | ${suffix}`,
            description: resUser.data?.hero?.subtitle || defaultDesc,
        };
    } catch {
        return { title: `${username} | Expert Visits` };
    }
}

export default async function UserLayout({ children, params }) {
    const { username } = await params;

    let user;
    try {
        user = await getUser(username);
    } catch (error) {
        console.error("Failed to load user:", error);
        return notFound();
    }

    if (!user) {
        return notFound();
    }

    const TemplateLayout = getTemplateLayout(user.template_id);

    // Render the selected template's layout wrapper around the specific page content
    return (
        <TemplateLayout user={user}>
            {children}
        </TemplateLayout>
    );
}
