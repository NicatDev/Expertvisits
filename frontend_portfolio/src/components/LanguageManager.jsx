"use client";

import { useEffect } from "react";
import { useTranslation } from "@/i18n/client";

export default function LanguageManager({ lang }) {
    const { i18n } = useTranslation();
    
    useEffect(() => {
        // Only apply the profile language if user hasn't explicitly chosen a language
        const cookieMatch = document.cookie.match(/(?:^|;\s*)i18next=([^;]*)/);
        const cookieLang = cookieMatch ? cookieMatch[1] : null;
        const storedLang = localStorage.getItem('i18nextLng');
        
        // If user already picked a language via switcher, respect that choice
        if (cookieLang || storedLang) {
            return;
        }
        
        // No explicit choice — use profile language as initial default
        if (lang && i18n.language !== lang) {
            i18n.changeLanguage(lang);
            document.cookie = `i18next=${lang}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem('i18nextLng', lang);
        }
    }, [lang, i18n]);

    return null;
}
