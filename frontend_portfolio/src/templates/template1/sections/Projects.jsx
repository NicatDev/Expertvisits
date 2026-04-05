'use client';

import React from 'react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/template1.module.scss';
import ProjectsHomeSection from '@/components/portfolio/ProjectsHomeSection';

export default function Projects({ user, sectionIndex = 1 }) {
    const { t } = useTranslation();
    const titleSlot = (
        <h2 className={styles.sectionTitle}>
            <span>0{sectionIndex} /</span> {t('portfolio.projects')}
        </h2>
    );
    return <ProjectsHomeSection user={user} styles={styles} titleSlot={titleSlot} />;
}
