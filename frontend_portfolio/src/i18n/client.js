'use client';

import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getOptions, languages } from './settings';

const runsOnServerSide = typeof window === 'undefined';

i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(resourcesToBackend((language, namespace) => import(`./locales/${language}.json`)))
    .init({
        ...getOptions(),
        lng: undefined,
        detection: {
            order: ['localStorage', 'htmlTag', 'cookie', 'navigator'],
            caches: ['localStorage', 'cookie'],
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
    }
    return ret;
}
