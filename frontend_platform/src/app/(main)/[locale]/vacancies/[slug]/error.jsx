'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';

export default function VacancyDetailError({ error, reset }) {
  const { t } = useTranslation('common');

  useEffect(() => {
    console.error('[vacancy detail]', error);
  }, [error]);

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 16px',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>
        {t('vacancy_page.error_title')}
      </h1>
      <p style={{ color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
        {t('vacancy_page.error_body')}
      </p>
      <Button type="primary" onClick={() => reset()}>
        {t('vacancy_page.error_retry')}
      </Button>
    </div>
  );
}
