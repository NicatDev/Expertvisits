"use client";

import { useEffect } from "react";
import { useTranslation } from "@/i18n/client";

export default function LanguageManager({ lang }) {
    const { i18n } = useTranslation();
    
    useEffect(() => {
        if (lang) {
            document.documentElement.lang = lang;
            if (i18n.language !== lang) {
                i18n.changeLanguage(lang);
            }
        }
    }, [lang, i18n]);

    return null;
}
