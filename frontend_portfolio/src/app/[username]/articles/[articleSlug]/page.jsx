import { getUser, getArticleDetail } from "@/lib/api/portfolio";
import { getTemplateArticleDetail } from "@/templates";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
    const { username, articleSlug } = await params;
    return {
        title: "Article | Portfolio",
        robots: {
            index: false,
            follow: false,
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
            <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang = "${articleLang}";` }} suppressHydrationWarning />
            <TemplateArticleDetail user={user} slug={articleSlug} />
        </>
    );
}
