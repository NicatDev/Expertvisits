const BASE_URL = 'https://expertvisits.com';
const LANGS = ['en', 'ru'];

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

/** Expand API static_urls + dynamic_urls into MetadataRoute.Sitemap entries. */
function expandSitemapEntries(sitemapData, seen) {
    const urls = [];
    const seenLocal = seen ?? new Set();

    for (const item of sitemapData.static_urls || []) {
        const u = normStaticPath(item.url);
        if (u === '/about') continue;

        pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}${u === '/' ? '/' : u}`, item, {
            priority: u === '/' ? 1.0 : item.priority ?? 0.8,
            changeFrequency: item.changefreq || 'daily',
        }));

        if (u === '/') {
            LANGS.forEach((lang) => {
                pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}/${lang}`, item, {
                    changeFrequency: 'daily',
                    priority: 0.9,
                }));
            });
            ['az', 'en', 'ru'].forEach((lang) => {
                pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}/u/${lang}`, item, {
                    changeFrequency: 'monthly',
                    priority: lang === 'az' ? 0.9 : 0.85,
                }));
            });
            continue;
        }

        if (u === '/experts') {
            LANGS.forEach((lang) => {
                pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}/experts/${lang}`, item, {
                    changeFrequency: item.changefreq || 'daily',
                    priority: 0.75,
                }));
            });
            continue;
        }

        if (u === '/vacancies') {
            LANGS.forEach((lang) => {
                pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}/vacancies/${lang}`, item, {
                    changeFrequency: item.changefreq || 'hourly',
                    priority: 0.85,
                }));
            });
            continue;
        }

        if (u === '/companies') {
            LANGS.forEach((lang) => {
                pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}/companies/${lang}`, item, {
                    changeFrequency: item.changefreq || 'daily',
                    priority: 0.75,
                }));
            });
        }
    }

    for (const item of sitemapData.dynamic_urls || []) {
        const path = item.url || '';
        if (!path.startsWith('/')) continue;

        if (path.startsWith('/article/')) {
            const slug = path.slice('/article/'.length);
            if (!slug) continue;
            pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}${path}`, item));
            continue;
        }

        const vacancyDetail = path.match(/^\/vacancies\/([^/]+)$/);
        if (vacancyDetail) {
            const seg = vacancyDetail[1];
            if (seg !== 'en' && seg !== 'ru') {
                pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}${path}`, item));
            }
            continue;
        }

        pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}${path}`, item));
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
