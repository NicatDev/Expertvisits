import { buildUrlsetXml, getChunkEntries } from '@/lib/seo/sitemapRuntime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(_request, context) {
    const params = await context.params;
    const raw = params?.id;
    const chunk = Math.max(0, parseInt(String(raw).replace(/\.xml$/i, ''), 10) || 0);

    const entries = await getChunkEntries(chunk);
    const xml = buildUrlsetXml(entries);

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
            Vary: 'Accept-Encoding',
            'X-Robots-Tag': 'noarchive',
        },
    });
}
