import { getUser } from "@/lib/api/portfolio";
import { getTemplateHome } from "@/templates";
import { notFound } from "next/navigation";

/**
 * User Portfolio Home Page
 * 
 * Renders the home page of the selected template. Data fetching is isolated here for specific page data if needed,
 * but primarily relies on `getUser` just to route correctly.
 */
export default async function UserHomePage({ params }) {
    const { username } = await params;

    let user;
    try {
        user = await getUser(username);
    } catch (error) {
        return notFound();
    }

    if (!user) return notFound();

    const TemplateHome = getTemplateHome(user.template);

    return <TemplateHome data={user.data || {}} user={user} />;
}
