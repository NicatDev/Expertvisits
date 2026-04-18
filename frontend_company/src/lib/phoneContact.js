/** Digits only for wa.me (any reasonable user-entered phone format). */
export function digitsForWhatsApp(phone) {
    if (!phone || typeof phone !== 'string') return '';
    return phone.replace(/\D/g, '');
}

export function whatsappMeUrl(phone) {
    const d = digitsForWhatsApp(phone);
    if (!d) return '';
    return `https://wa.me/${d}`;
}

export function telHref(phone) {
    if (!phone || typeof phone !== 'string') return '';
    const trimmed = phone.trim();
    if (!trimmed) return '';
    return `tel:${encodeURIComponent(trimmed)}`;
}
