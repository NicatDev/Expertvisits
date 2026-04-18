"use client";

import { useTranslation } from '@/i18n/client';
import styles from '../styles/innerPage.module.scss';

export default function PartnersPageClient({ company }) {
    const { t } = useTranslation();
    const partners = company?.partners || [];

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('partners.title')}</h1>
            {partners.length === 0 ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('home.noneYet')}</p>
            ) : (
                <div className={styles.partnerGrid}>
                    {partners.map((p) => (
                        <article key={p.id} className={styles.partnerCard}>
                            {p.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.logo} alt="" className={styles.partnerImg} />
                            ) : (
                                <div className={styles.partnerImg} style={{ background: '#e2e8f0' }} />
                            )}
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{p.title}</div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
