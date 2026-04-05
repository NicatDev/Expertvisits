/**
 * Feed kartları üçün yüngül HTML → düz mətn (DOM yoxdur).
 * Abzas və sətir sonlarını saxlayır.
 */
export function htmlToPlainWithBreaks(html) {
    if (!html || typeof html !== 'string') return '';

    let t = html
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/blockquote>/gi, '\n')
        .replace(/<\/pre>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'");

    t = t.replace(/[ \t\f\v]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
    return t.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * @returns {{ text: string, truncated: boolean }}
 */
export function htmlToFeedPreview(html, maxChars = 320) {
    const full = htmlToPlainWithBreaks(html);
    if (!full) return { text: '', truncated: false };
    if (full.length <= maxChars) {
        return { text: full, truncated: false };
    }
    const slice = full.slice(0, maxChars);
    const cut = slice.replace(/\s+\S*$/, '').trimEnd();
    return { text: (cut || slice.trimEnd()) + '…', truncated: true };
}
