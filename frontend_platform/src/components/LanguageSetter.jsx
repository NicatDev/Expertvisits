// frontend_platform/src/components/LanguageSetter.jsx
"use client";
import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/client';

export default function LanguageSetter({ lang }) {
    const { i18n } = useTranslation();
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!done) {
            if (i18n.resolvedLanguage !== lang) {
                i18n.changeLanguage(lang);
            }
            document.documentElement.lang = lang;
            document.cookie = `i18next=${lang}; path=/; max-age=31536000`;
            setDone(true);
        }
    }, [lang, i18n, done]);

    return null;
}
