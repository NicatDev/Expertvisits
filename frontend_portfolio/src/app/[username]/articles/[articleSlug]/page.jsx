import { getUser, getArticleDetail } from "@/lib/api/portfolio";
import { getTemplateArticleDetail } from "@/templates";
import { notFound } from "next/navigation";
import LanguageManager from "@/components/LanguageManager";

export async function generateMetadata({ params }) {
    const { username, articleSlug } = await params;
    let shareImage = '/logo.png';
    try {
        const user = await getUser(username);
        if (user?.avatar) shareImage = user.avatar;
    } catch (e) {}

    return {
        title: "Article | Portfolio",
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            images: [{ url: shareImage }],
        },
        twitter: {
            card: 'summary_large_image',
            images: [shareImage],
        }
    };
}

export default async function UserArticleDetailPage({ params }) {
    const { username, articleSlug } = await params;

    let user;
    let article;
    try {
        user = await getUser(username);
        article = await getArticleDetail(username, articleSlug);
    } catch (error) {
        return notFound();
    }

    if (!user || user.articles_count < 3 || !article) return notFound();

    const TemplateArticleDetail = getTemplateArticleDetail(user.template_id);
    const articleLang = article?.language || user?.user?.language || 'az';

    return (
        <>
            <LanguageManager lang={articleLang} />
            <TemplateArticleDetail user={user} slug={articleSlug} />
        </>
    );
}
