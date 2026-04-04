"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './profile.module.scss';
import ProfileContext from './context';

// APIs
import { auth, profiles } from '@/lib/api';

// Components
import ProfileHeader from './components/ProfileHeader';
import ScrollableProfileTabs from '@/components/ui/ScrollableProfileTabs';
import FollowListModal from '@/components/advanced/FollowListModal';
import { PasswordModal } from '@/components/advanced/ProfileModals';

// i18n
import { useTranslation } from '@/i18n/client';

export default function ProfileLayout({ children }) {
    const { t } = useTranslation('common');
    const { user: currentUser, refreshUser, loading: authLoading } = useAuth();
    const pathname = usePathname();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState('followers');
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            loadProfile();
        }
    }, [currentUser, authLoading]);

    const loadProfile = async () => {
        if (!currentUser) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            const res = await auth.getProfile();
            setProfile(res.data);
        } catch (err) {
            console.error("Load profile failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (data) => {
        try {
            await profiles.updateProfile(profile.username, data);
            loadProfile();
            refreshUser();
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    // Hooks must run before any conditional return (same order every render)
    const activeTab = useMemo(() => {
        if (pathname === '/profile' || pathname === '/profile/') return 'about';
        const parts = pathname.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : 'about';
    }, [pathname]);

    const profileTabs = useMemo(
        () => [
            { href: '/profile', label: t('profile.tabs.about'), active: activeTab === 'about' },
            { href: '/profile/services', label: t('profile.tabs.services') || 'Xidmətlər', active: activeTab === 'services' },
            { href: '/profile/projects', label: t('profile.tabs.projects', 'Layihələr'), active: activeTab === 'projects' },
            { href: '/profile/posts', label: t('profile.tabs.posts'), active: activeTab === 'posts' },
            { href: '/profile/booking', label: t('profile.tabs.booking'), active: activeTab === 'booking' },
            { href: '/profile/vacancies', label: t('profile.tabs.vacancies'), active: activeTab === 'vacancies' },
            { href: '/profile/applications', label: t('profile.tabs.applications'), active: activeTab === 'applications' },
        ],
        [activeTab, t]
    );

    if (authLoading || loading) return <div>{t('common.loading')}</div>;
    if (!profile) return <div>{t('profile.user_not_found')}</div>;

    return (
        <ProfileContext.Provider value={{ profile, loading, refreshProfile: loadProfile, isOwner: true }}>
            <div className={styles.container}>
                <ProfileHeader
                    profile={profile}
                    followersCount={profile.followers_count || 0}
                    onUpdateProfile={handleUpdateProfile}
                    onOpenFollow={(type) => { setFollowModalType(type); setShowFollowModal(true); }}
                    onTriggerActionMonitor={(type) => { if (type === 'password') setPasswordModalOpen(true); }}
                />

                <ScrollableProfileTabs tabs={profileTabs} />

                <div className={styles.tabContentOut}>
                    {children}
                </div>

                <ProfileHeaderModals
                    showFollowModal={showFollowModal}
                    setShowFollowModal={setShowFollowModal}
                    followModalType={followModalType}
                    profile={profile}
                    passwordModalOpen={passwordModalOpen}
                    setPasswordModalOpen={setPasswordModalOpen}
                    t={t}
                />
            </div>
        </ProfileContext.Provider>
    );
}

// Separated Modals component to keep main cleaner
const ProfileHeaderModals = ({ showFollowModal, setShowFollowModal, followModalType, profile, passwordModalOpen, setPasswordModalOpen, t }) => (
    <>
        <FollowListModal
            isOpen={showFollowModal}
            onClose={() => setShowFollowModal(false)}
            username={profile.username}
            type={followModalType}
        />

        <PasswordModal
            isOpen={passwordModalOpen}
            onClose={() => setPasswordModalOpen(false)}
            onSave={async (data) => {
                await profiles.changePassword(data);
                alert(t('profile.toasts.password_changed'));
            }}
        />
    </>
);
