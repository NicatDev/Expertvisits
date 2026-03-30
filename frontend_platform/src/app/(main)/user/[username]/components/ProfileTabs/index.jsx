"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';

const ProfileTabs = ({ username }) => {
    const pathname = usePathname();
    const { t } = useTranslation('common');

    // Determine active tab based on path
    const isPosts = pathname.endsWith('/posts');
    const isVacancies = pathname.endsWith('/vacancies');
    const isServices = pathname.endsWith('/services');
    const isProjects = pathname.endsWith('/projects');
    const isAbout = !isPosts && !isVacancies && !isServices && !isProjects;

    return (
        <div className={styles.tabs}>
            <Link
                href={`/user/${username}`}
                className={isAbout ? styles.activeTab : ''}
            >
                {t('public_profile.tabs.about')}
            </Link>
            <Link
                href={`/user/${username}/services`}
                className={isServices ? styles.activeTab : ''}
            >
                {t('profile.tabs.services') || 'Xidmətlər'}
            </Link>
            <Link
                href={`/user/${username}/projects`}
                className={isProjects ? styles.activeTab : ''}
            >
                {t('profile.tabs.projects', 'Layihələr')}
            </Link>
            <Link
                href={`/user/${username}/posts`}
                className={isPosts ? styles.activeTab : ''}
            >
                {t('public_profile.tabs.posts')}
            </Link>
            <Link
                href={`/user/${username}/vacancies`}
                className={isVacancies ? styles.activeTab : ''}
            >
                {t('public_profile.tabs.vacancies')}
            </Link>
        </div>
    );
};

export default ProfileTabs;
