/**
 * Company microsite template from API (`company.website.template_id`).
 * @param {object|null|undefined} company
 * @returns {1|2|3}
 */
export function getMicrositeTemplateId(company) {
    const n = Number(company?.website?.template_id);
    if (n === 2) return 2;
    if (n === 3) return 3;
    return 1;
}
