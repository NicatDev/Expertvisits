"use client";

import { Briefcase, CalendarDays, MapPin, Wallet } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { formatVacancyDeadline } from '@/lib/vacancyCardFormat';
import { vacancyDetailUrl } from '@/lib/platformUrls';
import styles from '../styles/innerPage.module.scss';

export default function VacancyCard({ vac, locale }) {
    const { t } = useTranslation();
    const loc = locale || 'az';

    const listingLabel = (lt) => {
        if (lt === 'internship') return t('vacancies.typeInternship');
        return t('vacancies.typeJob');
    };

    return (
        <article className={styles.vacCard}>
            <div className={styles.vacCardInner}>
                <div className={styles.vacCardText}>
                    <h3 className={styles.vacTitle}>{vac.title}</h3>
                    <ul className={styles.vacMetaList}>
                        <li className={styles.vacMetaLine}>
                            <span className={styles.vacMetaIcon} aria-hidden>
                                <MapPin size={16} strokeWidth={2} />
                            </span>
                            <span className={styles.vacMetaText}>{vac.location || '—'}</span>
                        </li>
                        <li className={styles.vacMetaLine}>
                            <span className={styles.vacMetaIcon} aria-hidden>
                                <Briefcase size={16} strokeWidth={2} />
                            </span>
                            <span className={styles.vacMetaText}>
                                {listingLabel(vac.listing_type)}
                                {' · '}
                                {vac.job_type}
                                {' · '}
                                {vac.work_mode}
                            </span>
                        </li>
                        <li className={styles.vacMetaLine}>
                            <span className={styles.vacMetaIcon} aria-hidden>
                                <Wallet size={16} strokeWidth={2} />
                            </span>
                            <span className={styles.vacMetaText}>
                                {vac.salary_range?.trim() || t('vacancies.salaryNegotiable')}
                            </span>
                        </li>
                        {vac.expires_at ? (
                            <li className={styles.vacMetaLine}>
                                <span className={styles.vacMetaIcon} aria-hidden>
                                    <CalendarDays size={16} strokeWidth={2} />
                                </span>
                                <span className={styles.vacMetaText}>
                                    {t('vacancies.expires')}: {formatVacancyDeadline(vac.expires_at)}
                                </span>
                            </li>
                        ) : null}
                    </ul>
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
    );
}
