"use client";

import { useEffect } from "react";

export default function LanguageManager({ lang }) {
    useEffect(() => {
        if (lang) {
            document.documentElement.lang = lang;
        }
    }, [lang]);

    return null;
}
