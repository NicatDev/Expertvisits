import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

async function fetchSitemapChunkCount() {
    const API_BASE =
        (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
        'https://api.expertvisits.com/api/';

    function apiUrl(path) {
        const base = API_BASE.replace(/\/?$/, '/');
        const p = path.replace(/^\//, '');
        return `${base}${p}`;
    }

    try {
        const res = await fetch(apiUrl('seo/sitemap/meta/'), { next: { revalidate: 60 } });
        if (!res.ok) return 1;
        const meta = await res.json();
        return Math.max(1, Number(meta.chunk_count) || 1);
    } catch {
        return 1;
    }
}

export default async function robots() {
    await fetchSitemapChunkCount();
    const origin = SITE_ORIGIN.replace(/\/$/, '');

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/*/chat', '/*/notifications'],
        },
        sitemap: `${origin}/sitemap.xml`,
    };
}
