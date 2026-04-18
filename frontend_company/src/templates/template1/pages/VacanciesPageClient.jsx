"use client";

import { Briefcase, CalendarDays, MapPin, Wallet } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { vacancyDetailUrl } from '@/lib/platformUrls';
import styles from '../styles/innerPage.module.scss';

function formatDate(iso, locale) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(locale?.startsWith('en') ? 'en-GB' : 'az-AZ', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return String(iso);
    }
}

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
                    {list.map((v) => (
                        <article key={v.id} className={styles.vacCard}>
                            <div className={styles.vacCardHead}>
                                <div style={{ minWidth: 0 }}>
                                    <div className={styles.vacTitle}>{v.title}</div>
                                    <div className={styles.vacMetaList} style={{ marginTop: '0.65rem' }}>
                                        <div className={styles.vacMetaItem}>
                                            <MapPin size={17} aria-hidden />
                                            <span>{v.location || '—'}</span>
                                        </div>
                                        <div className={styles.vacMetaItem}>
                                            <Briefcase size={17} aria-hidden />
                                            <span>
                                                {listingLabel(v.listing_type)} · {v.job_type} · {v.work_mode}
                                            </span>
                                        </div>
                                        {v.salary_range ? (
                                            <div className={styles.vacMetaItem}>
                                                <Wallet size={17} aria-hidden />
                                                <span>{v.salary_range}</span>
                                            </div>
                                        ) : null}
                                        {v.expires_at ? (
                                            <div className={styles.vacMetaItem}>
                                                <CalendarDays size={17} aria-hidden />
                                                <span>
                                                    {t('vacancies.expires')}: {formatDate(v.expires_at, loc)}
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <a
                                    href={vacancyDetailUrl(v.slug, loc)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.vacBtn}
                                >
                                    {t('vacancies.applyOnPlatform')}
                                </a>
                            </div>
                            {v.description?.trim() ? (
                                <div className={styles.vacDesc}>{v.description.trim()}</div>
                            ) : null}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
