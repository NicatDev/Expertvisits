"use client";
import React, { useState } from 'react';
import { User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import { usePublicProfile } from '../../context';
import FollowListModal from '@/components/advanced/FollowListModal';
import BookingViewWrapper from '../BookingViewWrapper';
import { services } from '@/lib/api';

const ProfileHeader = () => {
    const { t } = useTranslation('common');
    const { profile, isFollowing, followersCount, followingCount, handleFollow, isMe } = usePublicProfile();

    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followType, setFollowType] = useState('followers');
    const [isBookingView, setIsBookingView] = useState(false);
    const [calendarEvents, setCalendarEvents] = useState([]);

    const handleOpenFollow = (type) => {
        setFollowType(type);
        setShowFollowModal(true);
    };

    const loadEvents = async () => {
        if (!profile) return;
        try {
            // We can optimize this to only load when booking view is opened?
            // Or load it if needed. For now let's load when opening modal.
            const eventsRes = await services.getEvents(profile.id);
            setCalendarEvents(eventsRes.data);
        } catch (e) {
            console.error("Failed to load events", e);
        }
    };

    const openBooking = async () => {
        setIsBookingView(true);
        await loadEvents();
    };

    if (!profile) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.coverContainer}>
                    {profile.cover_image ? (
                        <img src={profile.cover_image} className={styles.coverImage} alt="Cover" />
                    ) : (
                        <div className={styles.defaultCover} style={{ background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' }} />
                    )}
                </div>

                <div className={styles.info}>
                    <div className={styles.avatarContainer}>
                        {profile.avatar ? (
                            <img src={profile.avatar} className={styles.avatar} alt="Avatar" />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                <User size={40} />
                            </div>
                        )}
                    </div>

                    <div className={styles.names}>
                        <h1>{profile.first_name} {profile.last_name}</h1>
                        <p className={styles.subtitle}>@{profile.username} • {profile.profession_sub_category?.profession || profile.profession_sub_category?.name || 'Professional'}</p>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '14px', color: '#666' }}>
                            <span
                                style={{ cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => handleOpenFollow('followers')}
                            >
                                <strong>{followersCount}</strong> {t('profile.followers', { defaultValue: 'Followers' })}
                            </span>
                            <span
                                style={{ cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => handleOpenFollow('following')}
                            >
                                <strong>{followingCount || 0}</strong> {t('profile.following', { defaultValue: 'Following' })}
                            </span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {!isMe && (
                            <>
                                <Button
                                    type={isFollowing ? "default" : "primary"}
                                    onClick={handleFollow}
                                >
                                    {isFollowing ? t('public_profile.unfollow') : t('public_profile.follow')}
                                </Button>
                                <Button type="default" onClick={openBooking}>
                                    {t('public_profile.book_now')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isBookingView && (
                <BookingViewWrapper
                    profile={profile}
                    events={calendarEvents}
                    onClose={() => setIsBookingView(false)}
                    onBookingSuccess={() => loadEvents()} // Reload events
                />
            )}

            <FollowListModal
                isOpen={showFollowModal}
                onClose={() => setShowFollowModal(false)}
                type={followType}
                username={profile.username}
            />
        </div>
    );
};

export default ProfileHeader;
