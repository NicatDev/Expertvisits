import {
    BASE_URL,
    buildSitemapIndexXml,
    fetchSitemapMeta,
    buildUrlsetXml,
    getChunkEntries,
} from '@/lib/seo/sitemapRuntime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
    // --- PAGINATION KODU (Müvəqqəti yığışdırılıb) ---
    // let n = 1;
    // try {
    //     const meta = await fetchSitemapMeta();
    //     n = Math.max(1, Number(meta.chunk_count) || 1);
    // } catch {
    //     n = 1;
    // }
    //
    // const locs = Array.from({ length: n }, (_, i) => `${BASE_URL}/sitemap/${i}.xml`);
    // const xml = buildSitemapIndexXml(locs);
    // ------------------------------------------------

    // --- MÜVƏQQƏTİ: sitemap.xml birbaşa 0-cı hissəni qaytarır ---
    const entries = await getChunkEntries(0);
    const xml = buildUrlsetXml(entries);
    // -----------------------------------------------------------

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
            Vary: 'Accept-Encoding',
            'X-Robots-Tag': 'noarchive',
        },
    });
}
