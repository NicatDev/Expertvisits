"use client";

import { useTranslation } from '@/i18n/client';
import VacancyCard from '../components/VacancyCard';
import styles from '../styles/innerPage.module.scss';

export default function VacanciesPageClient({ vacancies, companySlug: _companySlug }) {
    const { t, i18n } = useTranslation();
    const loc = i18n.language || 'az';
    const list = vacancies?.results || vacancies || [];

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('vacancies.title')}</h1>
            {list.length === 0 ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('vacancies.empty')}</p>
            ) : (
                <div className={styles.vacList}>
                    {list.map((vac) => (
                        <VacancyCard key={vac.id} vac={vac} locale={loc} />
                    ))}
                </div>
            )}
        </div>
    );
}
