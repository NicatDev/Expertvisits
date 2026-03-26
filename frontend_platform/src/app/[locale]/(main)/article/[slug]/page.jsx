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
    const lng = cookieStore.get('i18next')?.value || 'en';
    const article = await getArticle(slug);

    if (!article) {
        return {
            title: lng === 'az' ? 'Məqalə tapılmadı | Expert Visits' : (lng === 'ru' ? 'Статья не найдена | Expert Visits' : 'Article Not Found | Expert Visits'),
        };
    }

    const titleSuffix = lng === 'az' ? 'Expert Visits' : (lng === 'ru' ? 'Expert Visits' : 'Expert Visits');
    const defaultDesc = lng === 'az' ? 'Məqaləni Expert Visits-də oxuyun.' : (lng === 'ru' ? 'Читайте эту статью на Expert Visits.' : 'Read this article on Expert Visits.');
    
    // Fallback HTML stripping if body has html tags
    const cleanBody = article.body ? article.body.replace(/<[^>]+>/g, '') : '';
    const desc = cleanBody ? cleanBody.substring(0, 160) : defaultDesc;

    return {
        title: `${article.title} | ${titleSuffix}`,
        description: desc,
        openGraph: {
            title: article.title,
            description: desc,
            images: article.cover_image || article.image ? [article.cover_image || article.image] : [],
            type: "article",
            locale: lng === 'az' ? 'az_AZ' : (lng === 'ru' ? 'ru_RU' : 'en_US')
        },
    };
}

export default async function Page({ params }) {
    const { slug } = await params;
    return <ClientPage slug={slug} />;
}
