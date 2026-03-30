import { getUser } from "@/lib/api/portfolio";
import { getTemplateContact } from "@/templates";
import { notFound } from "next/navigation";

import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
    const { username } = await params;
    const cookieStore = await cookies();
    const cookieLng = cookieStore.get('i18next')?.value || 'en';

    try {
        const userResponse = await getUser(username);
        const lng = userResponse?.user?.language || cookieLng;

        if (!userResponse) return { title: lng === 'az' ? 'Əlaqə | Expert Visits' : (lng === 'ru' ? 'Контакты | Expert Visits' : 'Contact | Expert Visits') };

        const profile = userResponse.user || {};
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || username;

        let title, description, ogDesc;

        if (lng === 'az') {
            title = `Əlaqə - ${fullName} | Expert Visits`;
            description = `${fullName} ilə əlaqə saxlayın. Mesaj göndərin, iş təklifləri və əməkdaşlıq üçün müraciət edin.`;
            ogDesc = `${fullName} ilə əlaqə saxlayın. Yeni iş imkanları və əməkdaşlıqlar üçün açıqdır.`;
        } else if (lng === 'ru') {
            title = `Контакты - ${fullName} | Expert Visits`;
            description = `Свяжитесь с ${fullName}. Отправьте сообщение, предложите сотрудничество или работу.`;
            ogDesc = `Свяжитесь с ${fullName} для рабочих возможностей и сотрудничества.`;
        } else {
            title = `Contact ${fullName} | Expert Visits`;
            description = `Get in touch with ${fullName}. Send a message for work opportunities and collaborations.`;
            ogDesc = `Get in touch with ${fullName} for work opportunities and collaborations.`;
        }
        
        const shareImage = profile.avatar || '/logo.png';
        
        return {
            title: title,
            description: description,
            openGraph: {
                title: title,
                description: ogDesc,
                images: [{ url: shareImage }],
                type: 'website',
            },
            icons: {
                icon: '/logo.png',
                apple: '/logo.png',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: ogDesc,
                images: [shareImage],
            }
        };
    } catch (e) {
        return {
            title: lng === 'az' ? 'Əlaqə | Expert Visits' : (lng === 'ru' ? 'Контакты | Expert Visits' : 'Contact | Expert Visits'),
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
