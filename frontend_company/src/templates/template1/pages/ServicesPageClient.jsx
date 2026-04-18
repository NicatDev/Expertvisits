"use client";

import { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { parseServiceSteps } from '@/lib/parseServiceSteps';
import DetailModal from '../components/DetailModal';
import styles from '../styles/innerPage.module.scss';
import modalStyles from '../styles/detailModal.module.scss';

export default function ServicesPageClient({ company }) {
    const { t } = useTranslation();
    const services = company?.services || [];
    const [openId, setOpenId] = useState(null);

    const selected = openId != null ? services.find((s) => s.id === openId) : null;
    const steps = selected ? parseServiceSteps(selected.steps) : [];

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('services.title')}</h1>
            {services.length === 0 ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('home.noneYet')}</p>
            ) : (
                <div className={styles.grid}>
                    {services.map((s) => {
                        return (
                            <article
                                key={s.id}
                                className={styles.card}
                                style={{ cursor: 'pointer' }}
                                role="button"
                                tabIndex={0}
                                onClick={() => setOpenId(s.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setOpenId(s.id);
                                    }
                                }}
                            >
                                <div className={styles.cardBody}>
                                    <h2 className={styles.cardTitle}>{s.title}</h2>
                                    <div className={styles.cardDesc}>
                                        {(s.description || '').slice(0, 220)}
                                        {(s.description || '').length > 220 ? '…' : ''}
                                    </div>
                                    <span className={styles.ext} style={{ pointerEvents: 'none' }}>
                                        {t('services.openDetail')} →
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <DetailModal
                open={Boolean(selected)}
                onClose={() => setOpenId(null)}
                title={selected?.title}
            >
                {selected ? (
                    <>
                        <div className={modalStyles.body}>{selected.description || ''}</div>
                        {steps.length > 0 ? (
                            <ul className={modalStyles.steps}>
                                {steps.map((st, i) => (
                                    <li key={i}>{typeof st === 'string' ? st : st?.text || JSON.stringify(st)}</li>
                                ))}
                            </ul>
                        ) : null}
                    </>
                ) : null}
            </DetailModal>
        </div>
    );
}
