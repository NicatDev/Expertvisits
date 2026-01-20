"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './profile.module.scss';

// APIs
import { auth, profiles, business } from '@/lib/api';

// Components
import FollowListModal from '@/components/advanced/FollowListModal';
import ProfileHeader from './components/ProfileHeader';
import AboutTab from './components/AboutTab';
import PostsTab from './components/PostsTab';
import BookingTab from './components/BookingTab';
import VacanciesTab from './components/VacanciesTab';
import ApplicationsTab from './components/ApplicationsTab';

// Modals
import { PasswordModal } from '@/components/advanced/ProfileModals';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// i18n
import { useTranslation } from '@/i18n/client';

export default function PrivateProfilePage() {
    const { t } = useTranslation('common');
    const { user: currentUser, refreshUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('about');
    const [loading, setLoading] = useState(true);

    // Profile Data Sections (Passed to AboutTab)
    const [details, setDetails] = useState({
        experiences: [],
        educations: [],
        skills: [],
        languages: [],
        certificates: []
    });

    // Vacancies & Applications (Passed to respective Tabs)
    const [myVacancies, setMyVacancies] = useState([]);
    const [myApplications, setMyApplications] = useState([]);

    // Modals State covering global actions not handled by sub-components
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState('followers');
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    useEffect(() => {
        const savedTab = sessionStorage.getItem('profileActiveTab');
        if (savedTab) setActiveTab(savedTab);
    }, []);

    useEffect(() => {
        sessionStorage.setItem('profileActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        loadProfile();
    }, [currentUser]);

    const loadProfile = async () => {
        if (!currentUser) {
            if (!loading) setProfile(null);
            return;
        }

        try {
            // Fetch own profile
            const res = await auth.getProfile();
            const targetUser = res.data;
            if (!targetUser) {
                setProfile(null);
                setLoading(false);
                return;
            }
            setProfile(targetUser);

            // Fetch Related Data
            const [detailsRes, vacs, apps] = await Promise.all([
                profiles.getProfileDetails(targetUser.id),
                business.getMyVacancies(),
                business.getMyApplications()
            ]);

            const d = detailsRes.data;
            setDetails({
                experiences: d.experience || [],
                educations: d.education || [],
                skills: (d.skills || []).map(s => ({ ...s, skill_type: s.skill_type || 'hard' })),
                languages: d.languages || [],
                certificates: d.certificates || []
            });

            setMyVacancies(vacs.data.results || vacs.data || []);
            setMyApplications(apps.data.results || apps.data || []);

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

    return (
        <div className={styles.container}>
            <ProfileHeader
                profile={profile}
                followersCount={profile.followers_count || 0}
                onUpdateProfile={handleUpdateProfile}
                onOpenFollow={(type) => { setFollowModalType(type); setShowFollowModal(true); }}
                onTriggerActionMonitor={(type) => { if (type === 'password') setPasswordModalOpen(true); }}
            />

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={activeTab === 'about' ? styles.activeTab : ''} onClick={() => setActiveTab('about')}>{t('profile.tabs.about')}</button>
                <button className={activeTab === 'posts' ? styles.activeTab : ''} onClick={() => setActiveTab('posts')}>{t('profile.tabs.posts')}</button>
                <button className={activeTab === 'booking' ? styles.activeTab : ''} onClick={() => setActiveTab('booking')}>{t('profile.tabs.booking')}</button>
                <button className={activeTab === 'vacancies' ? styles.activeTab : ''} onClick={() => setActiveTab('vacancies')}>{t('profile.tabs.vacancies')}</button>
                <button className={activeTab === 'applications' ? styles.activeTab : ''} onClick={() => setActiveTab('applications')}>{t('profile.tabs.applications')}</button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'about' && (
                    <AboutTab
                        profile={profile}
                        details={details}
                        onUpdateProfile={handleUpdateProfile}
                        onRefresh={loadProfile}
                        isOwner={true}
                    />
                )}
                {activeTab === 'posts' && (
                    <PostsTab
                        isOwner={true}
                        profile={profile}
                    />
                )}
                {activeTab === 'booking' && (
                    <BookingTab
                        profile={profile}
                        setProfile={setProfile} // For optimistic updates on settings
                        isOwner={true}
                    />
                )}
                {activeTab === 'vacancies' && (
                    <VacanciesTab
                        vacancies={myVacancies}
                        setVacancies={setMyVacancies}
                        isOwner={true}
                        onRefresh={loadProfile}
                    />
                )}
                {activeTab === 'applications' && (
                    <ApplicationsTab
                        applications={myApplications}
                    />
                )}
            </div>

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
        </div>
    );
}
