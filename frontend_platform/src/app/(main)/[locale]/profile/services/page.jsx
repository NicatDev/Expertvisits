"use client";

import React from 'react';
import { useTranslation } from '@/i18n/client';
import { useProfile } from '../context';
import EntityServicesTab from '@/components/advanced/EntityServicesTab';
import styles from '../style.module.scss';

export default function ServicesPage() {
    const { t } = useTranslation('common');
    const { profile, loading: profileLoading, isOwner } = useProfile();

    if (profileLoading || !profile?.id) {
        return <div style={{ padding: '20px' }}>{t('common.loading')}</div>;
    }

    return (
        <EntityServicesTab
            scope="profile"
            isOwner={isOwner}
            profileUserId={profile.id}
            sectionClassName={styles.section}
        />
    );
}
