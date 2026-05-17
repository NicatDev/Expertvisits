/**
 * Company microsite template from API (`company.website.template_id`).
 * Template 2 (Tünd studiya) removed — legacy id maps to 1.
 * @param {object|null|undefined} company
 * @returns {1|3}
 */
export function getMicrositeTemplateId(company) {
    const n = Number(company?.website?.template_id);
    if (n === 3) return 3;
    return 1;
}
