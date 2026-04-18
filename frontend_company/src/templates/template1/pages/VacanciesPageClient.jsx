"use client";

import { useTranslation } from '@/i18n/client';
import { formatVacancyDeadline } from '@/lib/vacancyCardFormat';
import { vacancyDetailUrl } from '@/lib/platformUrls';
import styles from '../styles/innerPage.module.scss';

export default function VacanciesPageClient({ vacancies, companySlug: _companySlug }) {
    const { t, i18n } = useTranslation();
    const loc = i18n.language || 'az';
    const list = vacancies?.results || vacancies || [];

    const listingLabel = (lt) => {
        if (lt === 'internship') return t('vacancies.typeInternship');
        return t('vacancies.typeJob');
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('vacancies.title')}</h1>
            {list.length === 0 ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('vacancies.empty')}</p>
            ) : (
                <div className={styles.vacList}>
                    {list.map((vac) => (
                        <article key={vac.id} className={styles.vacCard}>
                            <div className={styles.vacCardInner}>
                                <div className={styles.vacCardText}>
                                    <div className={styles.vacTitle}>{vac.title}</div>
                                    <div className={styles.vacCompactLines}>
                                        <div>{vac.location || '—'}</div>
                                        <div>
                                            {listingLabel(vac.listing_type)}
                                            {' · '}
                                            {vac.job_type}
                                            {' · '}
                                            {vac.work_mode}
                                        </div>
                                        <div>{vac.salary_range?.trim() || t('vacancies.salaryNegotiable')}</div>
                                        {vac.expires_at ? (
                                            <div>
                                                {t('vacancies.expires')}: {formatVacancyDeadline(vac.expires_at)}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <a
                                    href={vacancyDetailUrl(vac.slug, loc)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.vacBtn}
                                >
                                    {t('vacancies.viewDetail')}
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
