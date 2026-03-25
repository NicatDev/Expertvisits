import { getUser } from "@/lib/api/portfolio";
import { getTemplateLayout } from "@/templates";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
    const { username } = await params;

    try {
        const user = await getUser(username);
        if (!user) {
            return { title: "Portfolio Not Found" };
        }
        return {
            title: `${user.full_name || username} | Portfolio`,
            description: user.data?.hero?.subtitle || `${user.full_name || username}'s portfolio`,
        };
    } catch {
        return { title: `${username} | Portfolio` };
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

    const TemplateLayout = getTemplateLayout(user.template);

    // Render the selected template's layout wrapper around the specific page content
    return (
        <TemplateLayout user={user}>
            {children}
        </TemplateLayout>
    );
}
