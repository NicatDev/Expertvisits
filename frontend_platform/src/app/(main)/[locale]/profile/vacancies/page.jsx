"use client";

import React from 'react';
import { useProfile } from '../context';
import EntityVacanciesTab from '@/components/advanced/EntityVacanciesTab';
import styles from '../style.module.scss';

export default function VacanciesPage() {
    const { isOwner, refreshProfile } = useProfile();

    return (
        <EntityVacanciesTab
            scope="profile"
            isOwner={isOwner}
            sectionClassName={styles.section}
            onProfileExtrasRefresh={refreshProfile}
        />
    );
}
