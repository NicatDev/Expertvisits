"use client";

import { useTranslation } from '@/i18n/client';
import { parseServiceSteps } from '@/lib/parseServiceSteps';
import styles from '../styles/innerPage.module.scss';

export default function ServicesPageClient({ company }) {
    const { t } = useTranslation();
    const services = company?.services || [];

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('services.title')}</h1>
            {services.length === 0 ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('home.noneYet')}</p>
            ) : (
                <div className={styles.grid}>
                    {services.map((s) => {
                        const steps = parseServiceSteps(s.steps);
                        return (
                            <article key={s.id} className={styles.card}>
                                <div className={styles.cardBody}>
                                    <h2 className={styles.cardTitle}>{s.title}</h2>
                                    <div className={styles.cardDesc}>{s.description}</div>
                                    {steps.length > 0 ? (
                                        <ul className={styles.steps}>
                                            {steps.map((st, i) => (
                                                <li key={i}>{typeof st === 'string' ? st : st?.text || JSON.stringify(st)}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
