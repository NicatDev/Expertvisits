'use client';

import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions, languages } from './settings';

const runsOnServerSide = typeof window === 'undefined';

// Manually detect saved language before i18next initializes
function getInitialLanguage() {
    if (runsOnServerSide) return undefined;
    try {
        // 1. Check cookie first
        const match = document.cookie.match(/(?:^|;\s*)i18next=([^;]*)/);
        if (match && match[1] && languages.includes(match[1])) return match[1];
        // 2. Check localStorage
        const stored = localStorage.getItem('i18nextLng');
        if (stored && languages.includes(stored)) return stored;
    } catch (e) {
        // ignore
    }
    return undefined;
}

const detectedLng = getInitialLanguage();

i18next
    .use(initReactI18next)
    .use(resourcesToBackend((language, namespace) => import(`./locales/${language}.json`)))
    .init({
        ...getOptions(detectedLng || undefined),
        lng: detectedLng || undefined,
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
