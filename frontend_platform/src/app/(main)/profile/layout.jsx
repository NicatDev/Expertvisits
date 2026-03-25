"use client";
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './profile.module.scss';
import ProfileContext from './context';

// APIs
import { auth, profiles } from '@/lib/api';

// Components
import ProfileHeader from './components/ProfileHeader';
import FollowListModal from '@/components/advanced/FollowListModal';
import { PasswordModal } from '@/components/advanced/ProfileModals';

// i18n
import { useTranslation } from '@/i18n/client';

export default function ProfileLayout({ children }) {
    const { t } = useTranslation('common');
    const { user: currentUser, refreshUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState('followers');
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [currentUser]);

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

    if (loading) return <div>{t('common.loading')}</div>;
    if (!profile) return <div>{t('profile.user_not_found')}</div>;

    // Determine active tab based on pathname
    // url: /profile -> active: about
    // url: /profile/about -> active: about (if accessed directly, but we prefer /profile)
    const getActiveTab = () => {
        if (pathname === '/profile' || pathname === '/profile/') return 'about';
        const segments = pathname.split('/');
        const lastSegment = segments.pop();
        return lastSegment;
    };
    const activeTab = getActiveTab();

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

                <div className={styles.tabs}>
                    <Link href="/profile" className={activeTab === 'about' ? styles.activeTab : ''}>{t('profile.tabs.about')}</Link>
                    <Link href="/profile/services" className={activeTab === 'services' ? styles.activeTab : ''}>{t('profile.tabs.services') || 'Services'}</Link>
                    <Link href="/profile/posts" className={activeTab === 'posts' ? styles.activeTab : ''}>{t('profile.tabs.posts')}</Link>
                    <Link href="/profile/booking" className={activeTab === 'booking' ? styles.activeTab : ''}>{t('profile.tabs.booking')}</Link>
                    <Link href="/profile/vacancies" className={activeTab === 'vacancies' ? styles.activeTab : ''}>{t('profile.tabs.vacancies')}</Link>
                    <Link href="/profile/applications" className={activeTab === 'applications' ? styles.activeTab : ''}>{t('profile.tabs.applications')}</Link>
                </div>

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
