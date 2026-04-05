"use client";

import React from 'react';
import { FolderKanban } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';
import styles from '../styles/services.module.scss';

export default function Projects({ user }) {
    const { t } = useTranslation();
    const v = mergeSectionVisibility(user?.section_visibility);
    if (!v.projects_on_home) return null;

    const projects = user?.projects || [];

    return (
        <section id="projects" className={styles.servicesSection} style={{ background: '#f8fafc' }}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <span className={styles.subTitle}>{t('portfolio.projects')}</span>
                    <h2 className={styles.sectionTitle}>{t('portfolio.projectsSectionTitle')}</h2>
                </div>

                {projects.length === 0 ? (
                    <p
                        style={{
                            textAlign: 'center',
                            color: '#64748b',
                            maxWidth: 560,
                            margin: '0 auto',
                            lineHeight: 1.5,
                        }}
                    >
                        {t('portfolio.projectsEmptyHome')}
                    </p>
                ) : (
                    <div className={styles.serviceGrid}>
                        {projects.map((p) => (
                            <div key={p.id} className={styles.serviceCard} style={{ cursor: 'default' }}>
                                <div className={styles.serviceIcon}>
                                    <FolderKanban size={28} />
                                </div>
                                <h3 className={styles.serviceTitle}>{p.title}</h3>
                                <p className={styles.serviceDescription}>
                                    {(p.description || '').substring(0, 160)}
                                    {(p.description || '').length > 160 ? '…' : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
