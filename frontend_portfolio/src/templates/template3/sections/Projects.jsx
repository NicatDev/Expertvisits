'use client';

import React from 'react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/template3.module.scss';
import homeStyles from '../styles/home.module.scss';
import ProjectsHomeSection from '@/components/portfolio/ProjectsHomeSection';

export default function Projects({ user }) {
    const { t } = useTranslation();
    const titleSlot = <div className={homeStyles.blockLabel}>{t('portfolio.projects')}</div>;
    return <ProjectsHomeSection user={user} styles={styles} titleSlot={titleSlot} />;
}
