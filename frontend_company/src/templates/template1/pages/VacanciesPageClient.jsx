"use client";

import { useTranslation } from '@/i18n/client';
import { vacancyDetailUrl } from '@/lib/platformUrls';
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
                    {list.map((v) => (
                        <div key={v.id} className={styles.vacRow}>
                            <div>
                                <div className={styles.vacTitle}>{v.title}</div>
                                <div className={styles.cardDesc}>
                                    {v.location} · {v.job_type} · {v.work_mode}
                                </div>
                            </div>
                            <a href={vacancyDetailUrl(v.slug, loc)} target="_blank" rel="noopener noreferrer" className={styles.vacBtn}>
                                {t('vacancies.applyOnPlatform')}
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
