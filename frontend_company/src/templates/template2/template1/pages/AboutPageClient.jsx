"use client";

import { useTranslation } from '@/i18n/client';
import styles from '../styles/innerPage.module.scss';

export default function AboutPageClient({ company }) {
    const { t } = useTranslation();
    const w = company?.who_we_are?.description?.trim();
    const d = company?.what_we_do?.description?.trim();
    const v = company?.our_values?.description?.trim();

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('about.title')}</h1>
            {w ? (
                <section className={styles.aboutBlock}>
                    <h2 className={styles.aboutH}>{t('about.who')}</h2>
                    <div className={styles.prose}>{w}</div>
                </section>
            ) : null}
            {d ? (
                <section className={styles.aboutBlock}>
                    <h2 className={styles.aboutH}>{t('about.what')}</h2>
                    <div className={styles.prose}>{d}</div>
                </section>
            ) : null}
            {v ? (
                <section className={styles.aboutBlock}>
                    <h2 className={styles.aboutH}>{t('about.values')}</h2>
                    <div className={styles.prose}>{v}</div>
                </section>
            ) : null}
            {!w && !d && !v ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('home.noneYet')}</p>
            ) : null}
        </div>
    );
}
