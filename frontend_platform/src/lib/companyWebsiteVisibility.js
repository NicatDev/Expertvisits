/** Mirrors backend company_website_visibility defaults (platform manage UI). */

export const DEFAULT_COMPANY_WEBSITE_VISIBILITY = {
    about_page: true,
    services_on_home: false,
    services_page: false,
    projects_on_home: false,
    projects_page: false,
    partners_on_home: false,
    partners_page: false,
    vacancies_on_home: false,
    vacancies_page: false,
    contact_page: true,
    show_phone_on_site: true,
    show_email_on_site: true,
};

export function mergeCompanyWebsiteVisibility(raw) {
    const out = { ...DEFAULT_COMPANY_WEBSITE_VISIBILITY };
    if (!raw || typeof raw !== 'object') return out;
    for (const key of Object.keys(DEFAULT_COMPANY_WEBSITE_VISIBILITY)) {
        if (key in raw) out[key] = Boolean(raw[key]);
    }
    return out;
}
