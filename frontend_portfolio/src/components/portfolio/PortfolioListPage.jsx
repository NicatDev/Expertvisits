'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/client';
import { resolvePortfolioMediaUrl, isDarkPortfolioTemplate } from '@/lib/portfolioMedia';
import styles from './portfolioListPage.module.scss';

function formatItemDate(dateVal) {
    if (!dateVal) return '';
    try {
        const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
        if (Number.isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return String(dateVal);
    }
}

export default function PortfolioListPage({ user, mode }) {
    const { t } = useTranslation();
    const username = user?.user?.username || '';
    const templateId = user?.template_id;
    const dark = isDarkPortfolioTemplate(templateId);
    const isServices = mode === 'services';
    const items = isServices ? user?.services || [] : user?.projects || [];
    const title = isServices ? t('portfolio.servicesPageTitle') : t('portfolio.projectsPageTitle');
    const empty = isServices ? t('portfolio.emptyServicesPage') : t('portfolio.emptyProjectsPage');

    const pageClass = `${styles.page} ${dark ? styles.pageDark : styles.pageLight}`;

    return (
        <div className={pageClass}>
            <div className={styles.inner}>
                <h1 className={styles.title}>{title}</h1>
                {items.length === 0 ? (
                    <p className={styles.empty}>{empty}</p>
                ) : (
                    <div className={styles.grid}>
                        {items.map((item) => (
                            <article key={item.id} className={styles.card}>
                                {!isServices && item.image ? (
                                    <div className={styles.thumbWrap}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={resolvePortfolioMediaUrl(item.image)}
                                            alt=""
                                            className={styles.thumb}
                                        />
                                    </div>
                                ) : null}
                                <h2>{item.title}</h2>
                                <p>{item.description}</p>
                                {!isServices && item.date ? (
                                    <time className={styles.meta} dateTime={String(item.date)}>
                                        {formatItemDate(item.date)}
                                    </time>
                                ) : null}
                                {isServices && Array.isArray(item.steps) && item.steps.length > 0 ? (
                                    <ol className={styles.steps}>
                                        {item.steps.map((step, i) => (
                                            <li key={i}>
                                                {typeof step === 'string'
                                                    ? step
                                                    : step?.title || step?.text || ''}
                                            </li>
                                        ))}
                                    </ol>
                                ) : null}
                            </article>
                        ))}
                    </div>
                )}
                <Link href={`/${username}`} className={styles.back}>
                    {t('portfolio.backToHome')}
                </Link>
            </div>
        </div>
    );
}
