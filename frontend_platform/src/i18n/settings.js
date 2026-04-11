import { defaultLocale, locales } from '@/lib/i18n/routing';

export const fallbackLng = defaultLocale;
export const languages = locales;
export const defaultNS = 'common';
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
