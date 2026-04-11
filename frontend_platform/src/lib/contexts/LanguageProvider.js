'use client';

import React, { useContext, useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { localeFromPathname } from '@/lib/i18n/routing';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/i18n/client_raw';
import { LanguageContext } from './LanguageContext';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * serverLng: cookie/header-based fallback for routes without /az|/en|/ru (e.g. /login).
 * When URL has a locale prefix, pathname wins so translations match the visible locale after client navigation.
 */
export function LanguageProvider({ children, lng: serverLng }) {
  const pathname = usePathname();
  const pathLocale = pathname ? localeFromPathname(pathname) : null;
  const lng = pathLocale ?? serverLng;

  if (typeof window === 'undefined' && i18next.language !== lng) {
    i18next.changeLanguage(lng);
  }

  useIsomorphicLayoutEffect(() => {
    if (lng && i18next.language !== lng) {
      i18next.changeLanguage(lng);
    }
  }, [lng]);

  useEffect(() => {
    if (lng && typeof document !== 'undefined') {
      document.documentElement.lang = lng;
    }
  }, [lng]);

  return (
    <LanguageContext.Provider value={{ lng }}>
      <I18nextProvider i18n={i18next}>
        {children}
      </I18nextProvider>
    </LanguageContext.Provider>
  );
}
