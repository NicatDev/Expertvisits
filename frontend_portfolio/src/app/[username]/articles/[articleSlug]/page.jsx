import { getUser } from "@/lib/api/portfolio";
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
    try {
        user = await getUser(username);
    } catch (error) {
        return notFound();
    }

    if (!user) return notFound();

    const TemplateArticleDetail = getTemplateArticleDetail(user.template_id);

    return <TemplateArticleDetail user={user} slug={articleSlug} />;
}
