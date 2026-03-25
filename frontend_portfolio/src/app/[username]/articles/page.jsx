import { getUser } from "@/lib/api/portfolio";
import { getTemplateArticles } from "@/templates";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Articles | Portfolio",
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

    const TemplateArticles = getTemplateArticles(user.template);

    return <TemplateArticles user={user} />;
}
