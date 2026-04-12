import ClientPage from './ClientPage';
import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/lib/api/getArticleBySlug';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildArticleMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata({ params }) {
  const { slug, locale: routeLocale } = await params;
  const loc = routeLocale || 'az';
  const article = await getArticleBySlug(slug, loc);
  if (!article) {
    return { title: 'Expert Visits', robots: { index: false, follow: false } };
  }
  return buildArticleMetadata({
    siteOrigin: SITE_ORIGIN,
    article,
    slug,
    routeLocale: loc,
  });
}

export default async function ArticlePage({ params }) {
  const { slug, locale: routeLocale } = await params;
  const article = await getArticleBySlug(slug, routeLocale || 'az');

  if (!article) {
    notFound();
  }

  return <ClientPage slug={slug} initialArticle={article} />;
}
