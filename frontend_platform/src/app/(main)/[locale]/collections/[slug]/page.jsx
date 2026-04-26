import CollectionDetailClient from './CollectionDetailClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { getCollectionBySlug } from '@/lib/api/getCollectionBySlug';
import { buildCollectionMetadata } from '@/lib/seo/meta/buildMetadata';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { locale, slug } = await params;
    const loc = locale || 'az';
    const collection = await getCollectionBySlug(slug, loc);
    if (!collection) {
        return { title: 'Expert Visits', robots: { index: false, follow: false } };
    }
    
    return buildCollectionMetadata({
        siteOrigin: SITE_ORIGIN,
        collection,
        slug,
        routeLocale: loc,
    });
}

export default async function CollectionDetailPage({ params }) {
    const { slug } = await params;
    return <CollectionDetailClient slug={slug} />;
}

