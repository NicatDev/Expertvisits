/**
 * Məqalə HTML-də xarici <a> linkləri: nofollow ugc + noopener noreferrer (TipTap məzmunu).
 */

const INTERNAL_HOSTS = new Set([
    'expertvisits.com',
    'www.expertvisits.com',
    'app.expertvisits.com',
    'api.expertvisits.com',
    'website.expertvisits.com',
    'localhost',
    '127.0.0.1',
]);

const EXTERNAL_REL = ['nofollow', 'ugc', 'noopener', 'noreferrer'];

function hostIsInternal(hostname) {
    const h = (hostname || '').toLowerCase().split(':')[0];
    if (!h) return true;
    if (INTERNAL_HOSTS.has(h)) return true;
    return h.endsWith('.expertvisits.com');
}

function hrefIsInternal(href, origin) {
    if (!href || href.startsWith('#')) return true;
    if (href.startsWith('mailto:')) return true;
    if (href.startsWith('/') && !href.startsWith('//')) return true;
    try {
        const url = new URL(href, origin);
        return hostIsInternal(url.hostname);
    } catch {
        return true;
    }
}

const REL_ORDER = ['nofollow', 'ugc', 'sponsored', 'noopener', 'noreferrer'];

function mergeRel(existing) {
    const tokens = new Set(EXTERNAL_REL);
    if (existing) {
        existing
            .split(/\s+/)
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t && t !== 'dofollow')
            .forEach((t) => tokens.add(t));
    }
    return REL_ORDER.filter((t) => tokens.has(t)).join(' ');
}

/** Canlı DOM-da məqalə gövdəsi linklərini tənzimləyir (SSR sonrası). */
export function applyArticleLinkPolicyToDom(root, origin = typeof window !== 'undefined' ? window.location.origin : 'https://expertvisits.com') {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        if (!href || hrefIsInternal(href, origin)) return;
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', mergeRel(a.getAttribute('rel')));
    });
}
