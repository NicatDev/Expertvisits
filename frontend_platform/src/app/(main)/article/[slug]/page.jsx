import Link from 'next/link';
import ClientPage from './ClientPage';
import { cookies } from 'next/headers';
import LanguageSetter from '@/components/LanguageSetter';

const BASE_URL = 'https://expertvisits.com';
const API_URL = 'https://api.expertvisits.com';
const FALLBACK_IMAGE = `${BASE_URL}/logo.png`;

async function getArticle(slug) {
    if (!slug) return;
    try {
        const res = await fetch(`${API_URL}/api/content/articles/${slug}/`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text, maxLen = 160) {
    if (!text || text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3).trimEnd() + '...';
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const systemLng = cookieStore.get('i18next')?.value || 'az';
    const article = await getArticle(slug);

    if (!article) {
        const notFoundTitles = {
            az: 'Məqalə tapılmadı | Expert Visits',
            ru: 'Статья не найдена | Expert Visits',
            en: 'Article Not Found | Expert Visits',
        };
        return {
            title: notFoundTitles[systemLng] || notFoundTitles.az,
            robots: { index: false },
        };
    }

    const articleLng = article.language || 'az';
    const localeMap = { az: 'az_AZ', ru: 'ru_RU', en: 'en_US' };
    const articleUrl = `${BASE_URL}/article/${slug}/`;

    // Clean body text for description
    const cleanBody = stripHtml(article.body);
    const description = truncate(cleanBody, 160) || article.title;

    // Resolve image: article image or fallback to site logo
    const articleImage = article.image || null;
    const ogImage = articleImage || FALLBACK_IMAGE;

    // Author name
    const authorName = article.author || 'Expert Visits';

    return {
        metadataBase: new URL(BASE_URL),
        title: `${article.title} | Expert Visits`,
        description: description,
        authors: [{ name: authorName }],
        alternates: {
            canonical: articleUrl,
            languages: {
                [articleLng]: articleUrl,
            },
        },
        openGraph: {
            title: article.title,
            description: description,
            url: articleUrl,
            siteName: 'Expert Visits',
            type: 'article',
            locale: localeMap[articleLng] || 'az_AZ',
            publishedTime: article.created_at,
            modifiedTime: article.updated_at || article.created_at,
            authors: [authorName],
            section: 'Articles',
            images: [
                {
                    url: ogImage,
                    width: articleImage ? 1200 : 800,
                    height: articleImage ? 630 : 600,
                    alt: article.title,
                    type: 'image/jpeg',
                },
            ],
        },
        twitter: {
            card: articleImage ? 'summary_large_image' : 'summary',
            title: article.title,
            description: description,
            images: [ogImage],
            creator: `@${article.author || 'expertvisits'}`,
        },
        robots: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    };
}

export default async function Page({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);
    const lang = article?.language || 'az';

    // JSON-LD Structured Data
    const jsonLd = article ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: truncate(stripHtml(article.body), 200),
        image: article.image || FALLBACK_IMAGE,
        datePublished: article.created_at,
        dateModified: article.updated_at || article.created_at,
        author: {
            '@type': 'Person',
            name: article.author || 'Expert Visits',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Expert Visits',
            logo: {
                '@type': 'ImageObject',
                url: `${BASE_URL}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BASE_URL}/article/${slug}/`,
        },
    } : null;

    return (
        <>
            <LanguageSetter lang={lang} />
            <script
                dangerouslySetInnerHTML={{ __html: `document.documentElement.lang = "${lang}";` }}
                suppressHydrationWarning
            />
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ClientPage slug={slug} />
        </>
    );
}

