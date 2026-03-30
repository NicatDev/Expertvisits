import { getUser } from "@/lib/api/portfolio";
import { getTemplateHome } from "@/templates";
import { notFound } from "next/navigation";

export const revalidate = 0;

/**
 * User Portfolio Home Page
 * 
 * Renders the home page of the selected template. 
 */
import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
    const { username } = await params;
    const cookieStore = await cookies();
    const cookieLng = cookieStore.get('i18next')?.value || 'en';

    try {
        const userResponse = await getUser(username);
        const lng = userResponse?.user?.language || cookieLng;

        if (!userResponse) return { title: lng === 'az' ? 'Portfel tapılmadı' : (lng === 'ru' ? 'Портфолио не найдено' : 'Portfolio Not Found') };
        
        const profile = userResponse.user || {};
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || username;
        const profession = profile.profession_sub_category?.[`profession_${lng}`] || profile.profession_sub_category?.profession || "";
        
        let titleSuffix, defaultDesc;
        if (lng === 'az') {
            titleSuffix = profession ? ` - ${profession} | Expert Visits` : " | Expert Visits";
            defaultDesc = `${fullName}-in rəsmi portfeli. Təcrübə, bacarıqlar və layihələrlə tanış olun.`;
        } else if (lng === 'ru') {
            titleSuffix = profession ? ` - ${profession} | Expert Visits` : " | Expert Visits";
            defaultDesc = `Официальное портфолио ${fullName}. Изучите опыт, навыки и проекты.`;
        } else {
            titleSuffix = profession ? ` - ${profession} | Expert Visits` : " | Expert Visits";
            defaultDesc = `Welcome to the official portfolio website of ${fullName}. Explore my experience, skills, and projects.`;
        }

        const title = `${fullName}${titleSuffix}`;
        const description = profile.summary ? profile.summary.substring(0, 160) : defaultDesc;
        
        const shareImage = profile.avatar || '/logo.png';
        
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: shareImage }],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [shareImage],
            }
        };
    } catch (e) {
        return {
            title: 'Expert Visits',
            description: "User Portfolio"
        };
    }
}
export default async function UserHomePage({ params }) {
    const { username } = await params;

    let user;
    try {
        user = await getUser(username);
        console.log(user);
    } catch (error) {
        console.log(error);
        return notFound();
    }
console.log(user)
    if (!user) return notFound();

    const TemplateHome = getTemplateHome(user.template_id);

    return <TemplateHome data={user.data || {}} user={user} />;
}
