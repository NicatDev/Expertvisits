'use client';

import React, { useContext, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/i18n/client_raw'; // I'll create this to avoid circular dependencies
import { LanguageContext } from './LanguageContext';

export function LanguageProvider({ children, lng }) {
  // Sync the language on the server during SSR before any child renders
  if (typeof window === 'undefined' && i18next.language !== lng) {
      i18next.changeLanguage(lng);
  }

  useEffect(() => {
    if (lng && i18next.language !== lng) {
      i18next.changeLanguage(lng);
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
