import { getUser } from "@/lib/api/portfolio";
import { getTemplateContact } from "@/templates";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Contact | Portfolio",
};

export default async function UserContactPage({ params }) {
    const { username } = await params;

    let user;
    try {
        user = await getUser(username);
    } catch (error) {
        return notFound();
    }

    if (!user) return notFound();

    const TemplateContact = getTemplateContact(user.template);

    return <TemplateContact user={user} />;
}
