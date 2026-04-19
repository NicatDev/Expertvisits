"use client";
import React, { useMemo } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { withLocale } from '@/lib/i18n/routing';
import ScrollableProfileTabs from '@/components/ui/ScrollableProfileTabs';
import { usePublicProfile } from '../../context';

const ProfileTabs = ({ username }) => {
    const pathname = usePathname();
    const params = useParams();
    const locale = params?.locale || 'az';
    const { t } = useTranslation('common');
    const { profile } = usePublicProfile();
    const tabUsername = profile?.username || username;

    const pathNorm = (pathname || '/').replace(/\/+$/, '') || '/';
    const isPosts = pathNorm.endsWith('/posts');
    const isVacancies = pathNorm.endsWith('/vacancies');
    const isServices = pathNorm.endsWith('/services');
    const isProjects = pathNorm.endsWith('/projects');
    const isAbout = !isPosts && !isVacancies && !isServices && !isProjects;

    const tabs = useMemo(
        () => {
            const u = encodeURIComponent(tabUsername);
            const p = (suffix) => withLocale(locale, `/user/${u}${suffix}`);
            return [
                {
                    href: p(''),
                    label: t('public_profile.tabs.about'),
                    active: isAbout,
                },
                {
                    href: p('/services'),
                    label: t('profile.tabs.services') || 'Xidmətlər',
                    active: isServices,
                },
                {
                    href: p('/projects'),
                    label: t('profile.tabs.projects', 'Layihələr'),
                    active: isProjects,
                },
                {
                    href: p('/posts'),
                    label: t('public_profile.tabs.posts'),
                    active: isPosts,
                },
                {
                    href: p('/vacancies'),
                    label: t('public_profile.tabs.vacancies'),
                    active: isVacancies,
                },
            ];
        },
        [tabUsername, locale, t, isAbout, isServices, isProjects, isPosts, isVacancies]
    );

    return <ScrollableProfileTabs tabs={tabs} />;
};

export default ProfileTabs;
