const HEX = /^#[0-9A-Fa-f]{6}$/;

export const THEME_DEFAULT_PRIMARY = '#1e40af';
export const THEME_DEFAULT_SECONDARY = '#6366f1';

export function normalizeThemeHex(input, fallback) {
    if (input == null || typeof input !== 'string') return fallback;
    const s = input.trim();
    return HEX.test(s) ? s.toLowerCase() : fallback;
}

export function parseCompanyWebsiteTheme(company) {
    const w = company?.website;
    return {
        primary: normalizeThemeHex(w?.theme_primary, THEME_DEFAULT_PRIMARY),
        secondary: normalizeThemeHex(w?.theme_secondary, THEME_DEFAULT_SECONDARY),
    };
}

/** Inline CSS variables on microsite root (.shell) — SCSS maps --t-accent from these. */
export function buildMicrositeThemeStyle(company) {
    const { primary, secondary } = parseCompanyWebsiteTheme(company);
    return {
        '--ev-primary': primary,
        '--ev-secondary': secondary,
    };
}
