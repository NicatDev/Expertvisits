"use client";

import { useTranslation } from '@/i18n/client';
import { mediaUrl } from '@/lib/mediaUrl';
import styles from '../styles/innerPage.module.scss';

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

    return (
        <div className={styles.page}>
            <h1 className={styles.h1}>{t('projects.title')}</h1>
            {projects.length === 0 ? (
                <p className={styles.prose} style={{ color: '#94a3b8' }}>{t('home.noneYet')}</p>
            ) : (
                <div className={styles.grid}>
                    {projects.map((p) => (
                        <article key={p.id} className={styles.card}>
                            {p.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mediaUrl(p.image)} alt="" className={styles.cardImg} />
                            ) : (
                                <div className={styles.cardImg} style={{ background: 'linear-gradient(135deg,#e2e8f0,#cbd5e1)' }} />
                            )}
                            <div className={styles.cardBody}>
                                <h2 className={styles.cardTitle}>{p.title}</h2>
                                {p.date ? <div className={styles.cardDate}>{formatDate(p.date, loc)}</div> : null}
                                <p className={styles.cardDesc}>{p.description}</p>
                                {p.url ? (
                                    <a href={p.url} target="_blank" rel="noopener noreferrer" className={styles.ext}>
                                        {t('projects.visit')} →
                                    </a>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
