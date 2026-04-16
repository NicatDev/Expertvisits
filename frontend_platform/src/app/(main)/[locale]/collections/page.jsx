import CollectionsPageClient from './CollectionsPageClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const loc = locale || 'az';
    const base = SITE_ORIGIN.replace(/\/$/, '');
    const title =
        loc === 'ru'
            ? 'Коллекции | Expert Visits'
            : loc === 'en'
              ? 'Collections | Expert Visits'
              : 'Kolleksiyalar | Expert Visits';
    const description =
        loc === 'ru'
            ? 'Подборки статей и тестов по темам.'
            : loc === 'en'
              ? 'Curated collections of articles and quizzes by topic.'
              : 'Mövzular üzrə məqalə və test kolleksiyaları.';
    const canonical = `${base}/${loc}/collections`;
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title, description, url: canonical, type: 'website' },
    };
}

export default function CollectionsPage() {
    return <CollectionsPageClient />;
}

