export const fallbackLng = 'az';
export const languages = [fallbackLng, 'en'];
export const defaultNS = 'company_site';
export const cookieName = 'i18next';

export function getOptions(lng = fallbackLng, ns = defaultNS) {
    return {
        supportedLngs: languages,
        fallbackLng,
        lng,
        fallbackNS: defaultNS,
        defaultNS,
        ns,
    };
}
