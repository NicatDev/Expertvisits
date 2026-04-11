import { cache } from 'react';

function getApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/';
  return raw.replace(/\/$/, '');
}

/**
 * Server: vakansiya detalı (slug). 404 → null; digər HTTP → throw; şəbəkə → throw.
 */
export const getVacancyBySlug = cache(async (slug, locale = 'az') => {
  if (!slug || typeof slug !== 'string') return null;

  const base = getApiBase();
  const url = `${base}/business/vacancies/${encodeURIComponent(slug)}/`;

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
      console.error('[getVacancyBySlug] HTTP', res.status, url);
      throw new Error(`VACANCY_HTTP_${res.status}`);
    }

    return await res.json();
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('VACANCY_HTTP_')) throw e;
    console.error('[getVacancyBySlug]', e);
    throw new Error('VACANCY_NETWORK');
  }
});
