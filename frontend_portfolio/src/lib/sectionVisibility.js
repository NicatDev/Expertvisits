export const DEFAULT_SECTION_VISIBILITY = {
    services_on_home: false,
    services_page: false,
    projects_on_home: false,
    projects_page: false,
    articles_on_home: false,
    articles_page: false,
};

export function mergeSectionVisibility(raw) {
    const out = { ...DEFAULT_SECTION_VISIBILITY };
    if (!raw || typeof raw !== 'object') return out;
    for (const key of Object.keys(DEFAULT_SECTION_VISIBILITY)) {
        if (Object.prototype.hasOwnProperty.call(raw, key)) {
            out[key] = Boolean(raw[key]);
        }
    }
    return out;
}
