"use client";

import React from 'react';
import { usePublicProfile } from '../context';
import { useTranslation } from '@/i18n/client';
import EntityVacanciesTab from '@/components/advanced/EntityVacanciesTab';
import layoutStyles from '../UserProfileLayoutClient/style.module.scss';

export default function UserVacanciesPage() {
    const { profile, loading } = usePublicProfile();
    const { t } = useTranslation('common');

    if (loading || !profile?.id) {
        return <div style={{ padding: 20 }}>{t('common.loading')}</div>;
    }

    return (
        <EntityVacanciesTab
            scope="profile"
            isOwner={false}
            profileUserId={profile.id}
            sectionClassName={layoutStyles.section}
            sectionTitle={t('public_profile.tabs.vacancies')}
        />
    );
}
