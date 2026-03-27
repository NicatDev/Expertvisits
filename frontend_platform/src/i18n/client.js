'use client';

import { useTranslation as useTranslationOrg } from 'react-i18next';
import { useContext } from 'react';
import { LanguageContext } from '@/lib/contexts/LanguageContext';
import './client_raw';

export function useTranslation(ns, options) {
    const { lng } = useContext(LanguageContext);
    const ret = useTranslationOrg(ns, { ...options, lng: options?.lng || lng });
    return ret;
}
