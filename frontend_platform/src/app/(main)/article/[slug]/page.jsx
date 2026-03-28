import Link from 'next/link';
import ClientPage from './ClientPage';

async function getArticle(slug) {
    if (!slug) return;
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/content/articles/${slug}/`, {
            cache: 'no-store', // Ensure fresh data
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const systemLng = cookieStore.get('i18next')?.value || 'az';
    const article = await getArticle(slug);

    if (!article) {
        return {
            title: systemLng === 'az' ? 'Məqalə tapılmadı | Expert Visits' : (systemLng === 'ru' ? 'Статья не найдена | Expert Visits' : 'Article Not Found | Expert Visits'),
        };
    }

    // Prioritize the article's detected language for SEO
    const articleLng = article.language || 'az';
    const localeMap = { az: 'az_AZ', ru: 'ru_RU', en: 'en_US' };

    // Choose suffix based on article language
    const titleSuffix = 'Expert Visits';

    // Clean body for description
    const cleanBody = article.body ? article.body.replace(/<[^>]+>/g, '') : '';
    const desc = cleanBody ? cleanBody.substring(0, 160) : article.title;

    return {
        title: `${article.title} | ${titleSuffix}`,
        description: desc,
        alternates: {
            // Tell Google exactly which language this version is
            canonical: `https://expertvisits.com/article/${slug}/`,
            languages: {
                [articleLng]: `https://expertvisits.com/article/${slug}/`,
            },
        },
        openGraph: {
            title: article.title,
            description: desc,
            url: `https://expertvisits.com/article/${slug}/`,
            siteName: "Expert Visits",
            images: article.cover_image || article.image ? [{ url: article.cover_image || article.image }] : [],
            type: "article",
            locale: localeMap[articleLng] || 'az_AZ',
            publishedTime: article.created_at,
            authors: [article.author_name || 'Expert Visits'],
        },
    };
}

import LanguageSetter from '@/components/LanguageSetter';

export default async function Page({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);
    const lang = article?.language || 'az';
    return (
        <>
            <LanguageSetter lang={lang} />
            <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang = "${lang}";` }} suppressHydrationWarning />
            <ClientPage slug={slug} />
        </>
    );
}
