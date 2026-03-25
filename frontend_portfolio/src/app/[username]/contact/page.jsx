import { getUser } from "@/lib/api/portfolio";
import { getTemplateContact } from "@/templates";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
    const { username } = await params;
    try {
        const userResponse = await getUser(username);
        if (!userResponse) return { title: "Contact | Portfolio" };

        const profile = userResponse.user || {};
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || username;
        
        return {
            title: `Contact ${fullName} | Portfolio`,
            description: `Get in touch with ${fullName}. Send a message, or find contact details like email and phone number.`,
            openGraph: {
                title: `Contact ${fullName} | Portfolio`,
                description: `Get in touch with ${fullName} for work opportunities and collaborations.`,
                images: [{ url: '/logo.png' }],
                type: 'website',
            }
        };
    } catch (e) {
        return {
            title: "Contact | Portfolio",
            description: "Get in touch via official portfolio contact page."
        };
    }
}

export default async function UserContactPage({ params }) {
    const { username } = await params;

    let user;
    try {
        user = await getUser(username);
    } catch (error) {
        return notFound();
    }

    if (!user) return notFound();

    const TemplateContact = getTemplateContact(user.template_id);

    return <TemplateContact user={user} />;
}
