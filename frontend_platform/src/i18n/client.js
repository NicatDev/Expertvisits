'use client';

import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getOptions, languages, cookieName } from './settings';

const runsOnServerSide = typeof window === 'undefined';

// Initialize i18next
i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(resourcesToBackend((language, namespace) => import(`./locales/${language}.json`)))
    .init({
        ...getOptions(),
        lng: undefined, // let detect the language on client side
        detection: {
            order: ['localStorage', 'htmlTag', 'cookie', 'navigator'],
            caches: ['localStorage', 'cookie'], // cache user language
            cookieOptions: { path: '/', sameSite: 'strict' },
            lookupLocalStorage: 'i18nextLng'
        },
        preload: runsOnServerSide ? languages : []
    });

export function useTranslation(ns, options) {
    const ret = useTranslationOrg(ns, options);
    const { i18n } = ret;
    if (runsOnServerSide && i18n.resolvedLanguage !== options?.lng) {
        i18n.changeLanguage(options?.lng);
    } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        // useEffect(() => {
        //   if (cookies.get(cookieName) === i18n.resolvedLanguage) return;
        //   cookies.set(cookieName, i18n.resolvedLanguage, { path: '/' });
        // }, [lng, i18n.resolvedLanguage]);
    }
    return ret;
}
