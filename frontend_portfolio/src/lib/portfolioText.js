export const PORTFOLIO_DESCRIPTION_PREVIEW = 160;

export function truncateDescription(text, max = PORTFOLIO_DESCRIPTION_PREVIEW) {
    const s = (text || '').trim();
    if (!s || s.length <= max) return { excerpt: s, needsMore: false, full: s };
    const cut = s.slice(0, max).trim();
    const lastSpace = cut.lastIndexOf(' ');
    const excerpt = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…';
    return { excerpt, needsMore: true, full: s };
}
