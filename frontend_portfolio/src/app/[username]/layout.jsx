import { getUser } from "@/lib/api/portfolio";
import { getTemplateLayout } from "@/templates";
import { notFound } from "next/navigation";
import LanguageManager from "@/components/LanguageManager";
import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
    const { username } = await params;
    const cookieStore = await cookies();
    const lng = cookieStore.get('i18next')?.value || 'en';

    try {
        const resUser = await getUser(username);
        const userLang = resUser?.user?.language || lng;

        if (!resUser) {
            return { title: userLang === 'az' ? 'Portfel tapılmadı' : (userLang === 'ru' ? 'Портфолио не найдено' : 'Portfolio Not Found') };
        }
        
        const profile = resUser.user || {};
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || username;
        const suffix = 'Expert Visits';
        const defaultDesc = userLang === 'az' ? `${fullName}-in rəsmi şəxsi portfeli.` : (userLang === 'ru' ? `Официальное персональное портфолио ${fullName}.` : `Official personal portfolio of ${fullName}.`);

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
    const userLang = user?.user?.language || 'az';
    return (
        <TemplateLayout user={user}>
            <LanguageManager lang={userLang} />
            {children}
        </TemplateLayout>
    );
}
