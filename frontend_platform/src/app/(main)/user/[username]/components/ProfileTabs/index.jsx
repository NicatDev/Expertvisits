"use client";
import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import ScrollableProfileTabs from '@/components/ui/ScrollableProfileTabs';

const ProfileTabs = ({ username }) => {
    const pathname = usePathname();
    const { t } = useTranslation('common');

    const isPosts = pathname.endsWith('/posts');
    const isVacancies = pathname.endsWith('/vacancies');
    const isServices = pathname.endsWith('/services');
    const isProjects = pathname.endsWith('/projects');
    const isAbout = !isPosts && !isVacancies && !isServices && !isProjects;

    const tabs = useMemo(
        () => [
            {
                href: `/user/${username}`,
                label: t('public_profile.tabs.about'),
                active: isAbout,
            },
            {
                href: `/user/${username}/services`,
                label: t('profile.tabs.services') || 'Xidmətlər',
                active: isServices,
            },
            {
                href: `/user/${username}/projects`,
                label: t('profile.tabs.projects', 'Layihələr'),
                active: isProjects,
            },
            {
                href: `/user/${username}/posts`,
                label: t('public_profile.tabs.posts'),
                active: isPosts,
            },
            {
                href: `/user/${username}/vacancies`,
                label: t('public_profile.tabs.vacancies'),
                active: isVacancies,
            },
        ],
        [username, t, isAbout, isServices, isProjects, isPosts, isVacancies]
    );

    return <ScrollableProfileTabs tabs={tabs} />;
};

export default ProfileTabs;
