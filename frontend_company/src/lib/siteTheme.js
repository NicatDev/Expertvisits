const HEX = /^#[0-9A-Fa-f]{6}$/;

export const THEME_DEFAULT_FONT = '#0f172a';
export const THEME_DEFAULT_BTN_PRIMARY_BG = '#1e40af';
export const THEME_DEFAULT_BTN_SECONDARY_FG = '#6366f1';

/** @deprecated use THEME_DEFAULT_BTN_PRIMARY_BG */
export const THEME_DEFAULT_PRIMARY = THEME_DEFAULT_BTN_PRIMARY_BG;
/** @deprecated use THEME_DEFAULT_BTN_SECONDARY_FG */
export const THEME_DEFAULT_SECONDARY = THEME_DEFAULT_BTN_SECONDARY_FG;

export function normalizeThemeHex(input, fallback) {
    if (input == null || typeof input !== 'string') return fallback;
    const s = input.trim();
    return HEX.test(s) ? s.toLowerCase() : fallback;
}

export function parseCompanyWebsiteTheme(company) {
    const w = company?.website;
    return {
        fontColor: normalizeThemeHex(w?.theme_font_color, THEME_DEFAULT_FONT),
        btnPrimaryBg: normalizeThemeHex(w?.theme_primary, THEME_DEFAULT_BTN_PRIMARY_BG),
        btnSecondaryFg: normalizeThemeHex(w?.theme_secondary, THEME_DEFAULT_BTN_SECONDARY_FG),
    };
}

/** User-tunable colors only — layout accents stay fixed per template SCSS. */
export function buildMicrositeThemeStyle(company) {
    const { fontColor, btnPrimaryBg, btnSecondaryFg } = parseCompanyWebsiteTheme(company);
    return {
        '--ev-font-color': fontColor,
        '--ev-btn-primary-bg': btnPrimaryBg,
        '--ev-btn-secondary-fg': btnSecondaryFg,
    };
}
