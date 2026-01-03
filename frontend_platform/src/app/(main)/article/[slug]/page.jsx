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

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);
    if (!article) {
        return {
            title: 'Article Not Found | Expert Visits',
        };
    }
    return {
        title: `${article.title} | Expert Visits`,
        description: article.body ? article.body.substring(0, 160) : 'Read this article on Expert Visits',
        openGraph: {
            title: article.title,
            description: article.body ? article.body.substring(0, 160) : '',
            images: article.image ? [article.image] : [],
        },
    };
}

export default async function Page({ params }) {
    const { slug } = await params;
    return <ClientPage slug={slug} />;
}
