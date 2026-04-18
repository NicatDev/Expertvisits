"use client";

import React from 'react';
import { usePublicProfile } from '../context';
import { useTranslation } from '@/i18n/client';
import EntityServicesTab from '@/components/advanced/EntityServicesTab';
import layoutStyles from '../UserProfileLayoutClient/style.module.scss';

export default function UserServicesPage() {
    const { profile, loading } = usePublicProfile();
    const { t } = useTranslation('common');

    if (loading || !profile?.id) {
        return <div style={{ padding: 20 }}>{t('common.loading')}</div>;
    }

    return (
        <EntityServicesTab
            scope="profile"
            isOwner={false}
            profileUserId={profile.id}
            sectionClassName={layoutStyles.section}
        />
    );
}
