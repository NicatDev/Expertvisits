import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

export const BASE_URL = SITE_ORIGIN.replace(/\/$/, '');

const LOCALES = ['az', 'en', 'ru'];

const API_BASE =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'https://api.expertvisits.com/api/';

export function apiUrl(path) {
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
 * API cavabından tam URL siyahısı (platform + /u portfolio).
 */
export function expandSitemapEntries(sitemapData, seen) {
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
                    }),
                );
            });
            LOCALES.forEach((lang) => {
                pushUnique(
                    urls,
                    seenLocal,
                    entryFromItem(`${BASE_URL}/u/${lang}`, item, {
                        changeFrequency: 'monthly',
                        priority: lang === 'az' ? 0.9 : 0.85,
                    }),
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
                    }),
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
            }),
        );
    }

    for (const item of sitemapData.dynamic_urls || []) {
        const path = item.url || '';
        if (!path.startsWith('/')) continue;

        if (path.startsWith('/article/')) {
            const slug = path.slice('/article/'.length).replace(/\/$/, '');
            if (!slug) continue;
            const lang = item.language || 'az';
            pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}/${lang}/article/${slug}`, item));
            continue;
        }

        const vacancyDetail = path.match(/^\/vacancies\/([^/]+)$/);
        if (vacancyDetail) {
            const seg = vacancyDetail[1];
            if (seg === 'en' || seg === 'ru' || seg === 'az') continue;
            const lang = item.language || 'az';
            pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}/${lang}/vacancies/${seg}`, item));
            continue;
        }

        if (path.startsWith('/u/')) {
            pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}${path}`, item));
            continue;
        }

        const hasLocalePrefix = /^\/(az|en|ru)\//.test(path);
        const fullPath = hasLocalePrefix ? path : `/az${path}`;
        pushUnique(urls, seenLocal, entryFromItem(`${BASE_URL}${fullPath}`, item));
    }

    return urls;
}

export async function fetchSitemapMeta() {
    const res = await fetch(apiUrl('seo/sitemap/meta/'), { next: { revalidate: 60 } });
    if (!res.ok) return { chunk_count: 1, chunk_limit: 45000 };
    return res.json();
}

export async function fetchSitemapChunk(chunk, limit) {
    const q = new URLSearchParams({ chunk: String(chunk), limit: String(limit) });
    const res = await fetch(`${apiUrl('seo/sitemap/')}?${q}`, { next: { revalidate: 60 } });
    if (res.ok) return res.json();
    if (chunk === 0) {
        const legacy = await fetch(apiUrl('seo/sitemap/'), { next: { revalidate: 60 } });
        if (legacy.ok) return legacy.json();
    }
    return { static_urls: [], dynamic_urls: [] };
}

export function escapeXml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** W3C Datetime (UTC): 2026-04-12T10:28:34+00:00 — millisaniyə və Z yox */
export function formatSitemapLastmod(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const iso = date.toISOString();
    const withoutMs = iso.replace(/\.\d{3}Z$/, 'Z');
    return withoutMs.replace('Z', '+00:00');
}

/** @param {{ url: string, lastModified?: Date, changeFrequency?: string, priority?: number }[]} entries */
export function buildUrlsetXml(entries) {
    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const e of entries) {
        const lastmod =
            e.lastModified instanceof Date && !Number.isNaN(e.lastModified.getTime())
                ? formatSitemapLastmod(e.lastModified)
                : null;
        lines.push('  <url>');
        lines.push(`    <loc>${escapeXml(e.url)}</loc>`);
        if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
        if (e.changeFrequency) lines.push(`    <changefreq>${escapeXml(e.changeFrequency)}</changefreq>`);
        if (e.priority != null) lines.push(`    <priority>${String(e.priority)}</priority>`);
        lines.push('  </url>');
    }
    lines.push('</urlset>');
    return lines.join('\n');
}

/** @param {string[]} locs - absolute URLs to child sitemaps */
export function buildSitemapIndexXml(locs) {
    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const loc of locs) {
        lines.push('  <sitemap>');
        lines.push(`    <loc>${escapeXml(loc)}</loc>`);
        lines.push('  </sitemap>');
    }
    lines.push('</sitemapindex>');
    return lines.join('\n');
}

export async function getChunkEntries(chunkIndex) {
    let limit = 45000;
    try {
        const meta = await fetchSitemapMeta();
        limit = Math.min(45000, Math.max(1, Number(meta.chunk_limit) || 45000));
    } catch {
        /* default */
    }
    const chunk = Math.max(0, Number(chunkIndex) || 0);
    let sitemapData = { static_urls: [], dynamic_urls: [] };
    try {
        sitemapData = await fetchSitemapChunk(chunk, limit);
    } catch (err) {
        console.error('Sitemap chunk fetch failed', err);
    }
    return expandSitemapEntries(sitemapData);
}
