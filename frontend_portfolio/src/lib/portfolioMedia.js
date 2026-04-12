/**
 * Turn API image paths (e.g. /media/...) into absolute URLs for <img src>.
 */
export function resolvePortfolioMediaUrl(src) {
    if (src == null || src === '') return '';
    if (typeof src !== 'string') return '';
    const trimmed = src.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/').replace(
        /\/?api\/?$/,
        ''
    );
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${apiBase}${path}`;
}

export function isDarkPortfolioTemplate(templateId) {
    const id = Number(templateId);
    return id === 1 || id === 3 || id === 4 || id === 6;
}
