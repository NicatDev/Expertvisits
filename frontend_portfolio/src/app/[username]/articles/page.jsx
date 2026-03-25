import { getUser } from "@/lib/api/portfolio";
import { getTemplateArticles } from "@/templates";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Articles | Portfolio",
    robots: {
        index: false,
        follow: false,
    }
};

export default async function UserArticlesPage({ params }) {
    const { username } = await params;

    let user;
    try {
        user = await getUser(username);
    } catch (error) {
        return notFound();
    }

    if (!user) return notFound();

    const TemplateArticles = getTemplateArticles(user.template_id);

    return <TemplateArticles user={user} />;
}
