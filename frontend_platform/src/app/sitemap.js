const BASE_URL = 'https://expertvisits.com';
const LOCALES = ['az', 'en', 'ru'];

const API_BASE =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'https://api.expertvisits.com/api/';

function apiUrl(path) {
    const base = API_BASE.replace(/\/?$/, '/');
    const p = path.replace(/^\//, '');
    return `${base}${p}`;
}

function normStaticPath(u) {
    if (!u || u === '/') return '/';
    return u.replace(/\/$/, '') || '/';
}

function pushUnique(out, seen, entry) {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    out.push(entry);
}

function entryFromItem(url, item, overrides = {}) {
    return {
        url,
        lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
        changeFrequency: overrides.changeFrequency ?? item.changefreq ?? 'weekly',
        priority: overrides.priority ?? item.priority ?? 0.7,
    };
}

/**
 * Maps legacy API paths to locale-prefixed public URLs.
 * Article/vacancy entries use `language` on the item when the API provides it (else `az`).
 */
function expandSitemapEntries(sitemapData, seen) {
    const urls = [];
    const seenLocal = seen ?? new Set();

    for (const item of sitemapData.static_urls || []) {
        const u = normStaticPath(item.url);
        if (u === '/about') continue;

        if (u === '/') {
            LOCALES.forEach((lang) => {
                pushUnique(
                    urls,
                    seenLocal,
                    entryFromItem(`${BASE_URL}/${lang}`, item, {
                        changeFrequency: 'daily',
                        priority: lang === 'az' ? 1.0 : 0.95,
                    })
                );
            });
            LOCALES.forEach((lang) => {
                pushUnique(
                    urls,
                    seenLocal,
                    entryFromItem(`${BASE_URL}/u/${lang}`, item, {
                        changeFrequency: 'monthly',
                        priority: lang === 'az' ? 0.9 : 0.85,
                    })
                );
            });
            continue;
        }

        if (u === '/experts' || u === '/vacancies' || u === '/companies') {
            const pri =
                u === '/vacancies'
                    ? { priority: 0.85, changefreq: 'hourly' }
                    : { priority: 0.75, changefreq: 'daily' };
            LOCALES.forEach((lang) => {
                pushUnique(
                    urls,
                    seenLocal,
                    entryFromItem(`${BASE_URL}/${lang}${u}`, item, {
                        changeFrequency: pri.changefreq,
                        priority: pri.priority,
                    })
                );
            });
            continue;
        }

        pushUnique(
            urls,
            seenLocal,
            entryFromItem(`${BASE_URL}${u.startsWith('/') ? u : `/${u}`}`, item, {
                priority: item.priority ?? 0.7,
                changeFrequency: item.changefreq || 'weekly',
            })
        );
    }

    for (const item of sitemapData.dynamic_urls || []) {
        const path = item.url || '';
        if (!path.startsWith('/')) continue;

        if (path.startsWith('/article/')) {
            const slug = path.slice('/article/'.length).replace(/\/$/, '');
            if (!slug) continue;
            const lang = item.language || 'az';
            pushUnique(
                urls,
                seenLocal,
                entryFromItem(`${BASE_URL}/${lang}/article/${slug}`, item)
            );
            continue;
        }

        const vacancyDetail = path.match(/^\/vacancies\/([^/]+)$/);
        if (vacancyDetail) {
            const seg = vacancyDetail[1];
            if (seg === 'en' || seg === 'ru' || seg === 'az') continue;
            const lang = item.language || 'az';
            pushUnique(
                urls,
                seenLocal,
                entryFromItem(`${BASE_URL}/${lang}/vacancies/${seg}`, item)
            );
            continue;
        }

        const hasLocalePrefix = /^\/(az|en|ru)\//.test(path);
        const fullPath = hasLocalePrefix ? path : `/az${path}`;
        pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}${fullPath}`, item));
    }

    return urls;
}

async function fetchSitemapMeta() {
    const res = await fetch(apiUrl('seo/sitemap/meta/'), { next: { revalidate: 60 } });
    if (!res.ok) return { chunk_count: 1, chunk_limit: 45000 };
    return res.json();
}

async function fetchSitemapChunk(chunk, limit) {
    const q = new URLSearchParams({ chunk: String(chunk), limit: String(limit) });
    const res = await fetch(`${apiUrl('seo/sitemap/')}?${q}`, { next: { revalidate: 60 } });
    if (res.ok) return res.json();
    if (chunk === 0) {
        const legacy = await fetch(apiUrl('seo/sitemap/'), { next: { revalidate: 60 } });
        if (legacy.ok) return legacy.json();
    }
    return { static_urls: [], dynamic_urls: [] };
}

export async function generateSitemaps() {
    try {
        const meta = await fetchSitemapMeta();
        const n = Math.max(1, Number(meta.chunk_count) || 1);
        return Array.from({ length: n }, (_, i) => ({ id: i }));
    } catch (err) {
        console.error('Sitemap meta fetch failed', err);
        return [{ id: 0 }];
    }
}

export default async function sitemap({ id }) {
    const resolvedId = id != null && typeof id === 'object' && 'then' in id ? await id : id;
    const chunk = Math.max(0, Number(resolvedId) || 0);

    let limit = 45000;
    try {
        const meta = await fetchSitemapMeta();
        limit = Math.min(45000, Math.max(1, Number(meta.chunk_limit) || 45000));
    } catch {
        /* use default */
    }

    let sitemapData = { static_urls: [], dynamic_urls: [] };
    try {
        sitemapData = await fetchSitemapChunk(chunk, limit);
    } catch (err) {
        console.error('Sitemap chunk fetch failed', err);
    }

    return expandSitemapEntries(sitemapData);
}
