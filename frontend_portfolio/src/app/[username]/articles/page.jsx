import { getUser } from "@/lib/api/portfolio";
import { getTemplateArticles } from "@/templates";
import { notFound } from "next/navigation";

import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
    const { username } = await params;
    const cookieStore = await cookies();
    const cookieLng = cookieStore.get('i18next')?.value || 'en';
    
    let lng = cookieLng;
    try {
        const userResponse = await getUser(username);
        if (userResponse?.user?.language) {
            lng = userResponse.user.language;
        }
    } catch (e) {}
    
    const title = lng === 'az' ? "Məqalələr | Portfel" : (lng === 'ru' ? "Статьи | Портфолио" : "Articles | Portfolio");
    
    let shareImage = '/logo.png';
    try {
        const user = await getUser(username);
        if (user?.avatar) shareImage = user.avatar;
    } catch (e) {}

    return {
        title: title,
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            images: [{ url: shareImage }],
        }
    };
}

export default async function UserArticlesPage({ params }) {
    const { username } = await params;

    let user;
    try {
        user = await getUser(username);
    } catch (error) {
        return notFound();
    }

    if (!user || user.articles_count < 3) return notFound();

    const TemplateArticles = getTemplateArticles(user.template_id);

    return <TemplateArticles user={user} />;
}
