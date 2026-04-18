/**
 * Turn relative Django media paths into absolute URLs for <img src>.
 */
export function mediaUrl(path) {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const origin = (
        process.env.NEXT_PUBLIC_MEDIA_ORIGIN ||
        (process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/').replace(/\/?api\/?$/i, '')
    ).replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${p}`;
}
