import {
    BASE_URL,
    buildSitemapIndexXml,
    fetchSitemapMeta,
} from '@/lib/seo/sitemapRuntime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
    let n = 1;
    try {
        const meta = await fetchSitemapMeta();
        n = Math.max(1, Number(meta.chunk_count) || 1);
    } catch {
        n = 1;
    }

    const locs = Array.from({ length: n }, (_, i) => `${BASE_URL}/sitemap/${i}.xml`);
    const xml = buildSitemapIndexXml(locs);

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
            Vary: 'Accept-Encoding',
            'X-Robots-Tag': 'noarchive',
        },
    });
}
