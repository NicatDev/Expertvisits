'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/client';
import styles from './portfolioListPage.module.scss';

export default function PortfolioListPage({ user, mode }) {
    const { t } = useTranslation();
    const username = user?.user?.username || '';
    const isServices = mode === 'services';
    const items = isServices ? user?.services || [] : user?.projects || [];
    const title = isServices ? t('portfolio.servicesPageTitle') : t('portfolio.projectsPageTitle');
    const empty = isServices ? t('portfolio.emptyServicesPage') : t('portfolio.emptyProjectsPage');

    return (
        <div className={styles.page}>
            <div className={styles.inner}>
                <h1 className={styles.title}>{title}</h1>
                {items.length === 0 ? (
                    <p className={styles.empty}>{empty}</p>
                ) : (
                    <div className={styles.grid}>
                        {items.map((item) => (
                            <article key={item.id} className={styles.card}>
                                {!isServices && item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={item.image}
                                        alt=""
                                        className={styles.thumb}
                                    />
                                ) : null}
                                <h2>{item.title}</h2>
                                <p>{item.description}</p>
                                {!isServices && item.date ? (
                                    <span className={styles.meta}>{item.date}</span>
                                ) : null}
                                {isServices && Array.isArray(item.steps) && item.steps.length > 0 ? (
                                    <ol className={styles.steps}>
                                        {item.steps.map((step, i) => (
                                            <li key={i}>{typeof step === 'string' ? step : step?.title || step?.text}</li>
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
