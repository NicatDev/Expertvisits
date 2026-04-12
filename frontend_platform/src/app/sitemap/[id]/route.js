import { buildUrlsetXml, getChunkEntries } from '@/lib/seo/sitemapRuntime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request, context) {
    const params = await context.params;
    const raw = params?.id;
    const chunk = Math.max(0, parseInt(String(raw).replace(/\.xml$/i, ''), 10) || 0);

    const entries = await getChunkEntries(chunk);
    const xml = buildUrlsetXml(entries);

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
    });
}
