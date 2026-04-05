/**
 * WebSocket URL for Django Channels (JWT query param).
 * Set NEXT_PUBLIC_WS_URL (e.g. wss://api.expertvisits.com) or derive from NEXT_PUBLIC_API_URL.
 */
export function getChatWebSocketUrl() {
    const explicit = process.env.NEXT_PUBLIC_WS_URL;
    if (explicit) {
        const base = explicit.replace(/\/$/, '');
        return `${base}/ws/chat/`;
    }
    const api = process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/';
    const wsOrigin = api
        .replace(/^http/i, (m) => (m.toLowerCase() === 'https' ? 'wss' : 'ws'))
        .replace(/\/?api\/?$/i, '');
    return `${wsOrigin.replace(/\/$/, '')}/ws/chat/`;
}

export function getChatWebSocketUrlWithToken() {
    const pathBase = getChatWebSocketUrl();
    if (typeof window === 'undefined') return pathBase;
    const token = localStorage.getItem('accessToken') || '';
    const sep = pathBase.includes('?') ? '&' : '?';
    return `${pathBase}${sep}token=${encodeURIComponent(token)}`;
}
