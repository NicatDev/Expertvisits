import { GET as getChunkSitemap } from '../[id]/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request, context) {
    return getChunkSitemap(request, context);
}
