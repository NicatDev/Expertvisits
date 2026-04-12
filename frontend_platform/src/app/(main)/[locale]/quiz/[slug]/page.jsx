import QuizDetailClient from './QuizDetailClient';
import { notFound } from 'next/navigation';
import { getQuizBySlug } from '@/lib/api/getQuizBySlug';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildQuizMetadata } from '@/lib/seo/meta/buildMetadata';

export async function generateMetadata({ params }) {
    const { slug, locale: routeLocale } = await params;
    const loc = routeLocale || 'az';
    const quiz = await getQuizBySlug(slug, loc);
    if (!quiz) {
        return { title: 'Expert Visits', robots: { index: false, follow: false } };
    }
    return buildQuizMetadata({
        siteOrigin: SITE_ORIGIN,
        quiz,
        slug,
        routeLocale: loc,
    });
}

export default async function QuizPage({ params }) {
    const { slug, locale: routeLocale } = await params;
    const quiz = await getQuizBySlug(slug, routeLocale || 'az');
    if (!quiz) {
        notFound();
    }

    return <QuizDetailClient slug={slug} initialQuiz={quiz} />;
}
