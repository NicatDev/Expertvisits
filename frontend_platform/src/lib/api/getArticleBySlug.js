import { cache } from 'react';

function getApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/';
  return raw.replace(/\/$/, '');
}

/**
 * Server Components üçün məqalə yükləmə (axios client ilə eyni baza URL).
 * Keş: eyni sorğuda təkrar fetch olunmur.
 * Mövcud deyilsə: null (caller notFound() — HTTP 404).
 */
export const getArticleBySlug = cache(async (slug, locale = 'az') => {
  if (!slug || typeof slug !== 'string') return null;

  const base = getApiBase();
  const url = `${base}/content/articles/${encodeURIComponent(slug)}/`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Accept-Language': locale,
      },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      console.error('[getArticleBySlug] HTTP', res.status, url);
      throw new Error(`ARTICLE_HTTP_${res.status}`);
    }

    return await res.json();
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('ARTICLE_HTTP_')) throw e;
    console.error('[getArticleBySlug]', e);
    throw new Error('ARTICLE_NETWORK');
  }
});
