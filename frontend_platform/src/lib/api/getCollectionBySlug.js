import { cache } from 'react';

function getApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/';
  return raw.replace(/\/$/, '');
}

/**
 * Server Components üçün collection yükləmə.
 */
export const getCollectionBySlug = cache(async (slug, locale = 'az', options = {}) => {
  if (!slug || typeof slug !== 'string') return null;

  const base = getApiBase();
  const url = `${base}/content/collections/${encodeURIComponent(slug)}/`;

  const headers = {
    Accept: 'application/json',
    'Accept-Language': locale,
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers,
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      console.error('[getCollectionBySlug] HTTP', res.status, url);
      throw new Error(`COLLECTION_HTTP_${res.status}`);
    }

    return await res.json();
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('COLLECTION_HTTP_')) throw e;
    console.error('[getCollectionBySlug]', e);
    throw new Error('COLLECTION_NETWORK');
  }
});
