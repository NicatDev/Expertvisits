export const DEFAULT_SECTION_VISIBILITY = {
    services_on_home: true,
    services_page: true,
    projects_on_home: true,
    projects_page: true,
    articles_on_home: true,
    articles_page: true,
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
