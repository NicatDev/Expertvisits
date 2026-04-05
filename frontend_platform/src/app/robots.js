const SITE_ORIGIN = 'https://expertvisits.com';

const API_BASE =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'https://api.expertvisits.com/api/';

function apiUrl(path) {
    const base = API_BASE.replace(/\/?$/, '/');
    const p = path.replace(/^\//, '');
    return `${base}${p}`;
}

async function fetchSitemapChunkCount() {
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
    const n = await fetchSitemapChunkCount();
    const origin = SITE_ORIGIN.replace(/\/$/, '');
    const sitemap = Array.from({ length: n }, (_, i) => `${origin}/sitemap/${i}.xml`);

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/chat', '/notifications'],
        },
        sitemap,
    };
}
