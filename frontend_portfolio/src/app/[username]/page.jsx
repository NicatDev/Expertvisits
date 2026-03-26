import { getUser } from "@/lib/api/portfolio";
import { getTemplateHome } from "@/templates";
import { notFound } from "next/navigation";

/**
 * User Portfolio Home Page
 * 
 * Renders the home page of the selected template. 
 */
export async function generateMetadata({ params }) {
    const { username } = await params;
    try {
        const userResponse = await getUser(username);
        if (!userResponse) return { title: "Portfolio Not Found" };
        
        const profile = userResponse.user || {};
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || username;
        const profession = profile.profession_sub_category?.profession || "";
        const titleSuffix = profession ? ` - ${profession} Portfolio` : " - Portfolio";
        const title = `${fullName}${titleSuffix}`;
        const description = profile.summary ? profile.summary.substring(0, 160) : `Welcome to the official portfolio website of ${fullName}. Explore my experience, skills, and projects.`;
        
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: '/logo.png' }],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: ['/logo.png'],
            }
        };
    } catch (e) {
        return {
            title: "Portfolio",
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
