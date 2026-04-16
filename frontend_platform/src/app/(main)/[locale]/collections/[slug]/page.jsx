import CollectionDetailClient from './CollectionDetailClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

export async function generateMetadata({ params }) {
    const { locale, slug } = await params;
    const loc = locale || 'az';
    const base = SITE_ORIGIN.replace(/\/$/, '');
    const canonical = `${base}/${loc}/collections/${slug}`;
    return {
        title:
            loc === 'ru'
                ? 'Детали коллекции | Expert Visits'
                : loc === 'en'
                  ? 'Collection detail | Expert Visits'
                  : 'Kolleksiya detalı | Expert Visits',
        description:
            loc === 'ru'
                ? 'Статьи и тесты в этой коллекции.'
                : loc === 'en'
                  ? 'Articles and quizzes in this collection.'
                  : 'Bu kolleksiyadakı məqalə və testlər.',
        alternates: { canonical },
    };
}

export default function CollectionDetailPage({ params }) {
    return <CollectionDetailClient slug={params.slug} />;
}

