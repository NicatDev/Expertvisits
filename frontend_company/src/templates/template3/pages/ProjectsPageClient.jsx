"use client";

import { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { mediaUrl } from '@/lib/mediaUrl';
import DetailModal from '../components/DetailModal';
import styles from '../styles/innerPage.module.scss';
import modalStyles from '../styles/detailModal.module.scss';

function formatDate(iso, locale) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(locale?.startsWith('en') ? 'en-GB' : 'az-AZ', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

export default function ProjectsPageClient({ company }) {
    const { t, i18n } = useTranslation();
    const projects = company?.company_projects || [];
    const loc = i18n.language || 'az';
    const [openId, setOpenId] = useState(null);

    const selected = openId != null ? projects.find((p) => p.id === openId) : null;

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('projects.title')}</h1>
            {projects.length === 0 ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('home.noneYet')}</p>
            ) : (
                <div className={styles.grid}>
                    {projects.map((p) => (
                        <article
                            key={p.id}
                            className={styles.card}
                            style={{ cursor: 'pointer' }}
                            role="button"
                            tabIndex={0}
                            onClick={() => setOpenId(p.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setOpenId(p.id);
                                }
                            }}
                        >
                            {p.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mediaUrl(p.image)} alt="" className={styles.projectCardImg} />
                            ) : (
                                <div className={styles.projectCardImgPlaceholder} aria-hidden />
                            )}
                            <div className={styles.cardBody}>
                                <h2 className={styles.cardTitle}>{p.title}</h2>
                                {p.date ? <div className={styles.cardDate}>{formatDate(p.date, loc)}</div> : null}
                                <p className={styles.cardDesc}>
                                    {(p.description || '').slice(0, 140)}
                                    {(p.description || '').length > 140 ? '…' : ''}
                                </p>
                                <span className={styles.ext} style={{ pointerEvents: 'none' }}>
                                    {t('projects.openDetail')} →
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <DetailModal
                open={Boolean(selected)}
                onClose={() => setOpenId(null)}
                title={selected?.title}
            >
                {selected ? (
                    <>
                        {selected.date ? (
                            <div className={modalStyles.meta}>{formatDate(selected.date, loc)}</div>
                        ) : null}
                        {selected.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(selected.image)} alt="" className={modalStyles.img} />
                        ) : null}
                        <div className={modalStyles.body}>{selected.description || ''}</div>
                        {selected.url ? (
                            <a
                                href={selected.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={modalStyles.ext}
                            >
                                {t('projects.visit')} →
                            </a>
                        ) : null}
                    </>
                ) : null}
            </DetailModal>
        </div>
    );
}
