import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
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
        lng: undefined, // let detect language automatically
        detection: {
            order: ['localStorage', 'htmlTag', 'cookie'],
            caches: ['localStorage', 'cookie'], // cache user language
            cookieOptions: { path: '/', sameSite: 'strict' },
            lookupLocalStorage: 'i18nextLng'
        },
        preload: runsOnServerSide ? languages : []
    });

export default i18next;
