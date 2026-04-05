"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import { usePublicProfile } from '../../context';
import FollowListModal from '@/components/advanced/FollowListModal';
import BookingViewWrapper from '../BookingViewWrapper';
import { services } from '@/lib/api';
import { chatApi } from '@/lib/api/chat';
import { toast } from 'react-toastify';

const ProfileHeader = () => {
    const { t, i18n } = useTranslation('common');
    const router = useRouter();
    const { profile, isFollowing, followersCount, followingCount, handleFollow, isMe } = usePublicProfile();

    const [showFollowModal, setShowFollowModal] = useState(false);
    const [chatOpening, setChatOpening] = useState(false);
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

    const canAcceptBookings =
        Boolean(profile?.is_service_open) &&
        Array.isArray(profile?.working_days) &&
        profile.working_days.length > 0;

    const openBooking = async () => {
        if (!canAcceptBookings) {
            toast.info(t('public_profile.booking_unavailable_toast'));
            return;
        }
        setIsBookingView(true);
        await loadEvents();
    };

    const openChatWithUser = async () => {
        if (!profile) return;
        setChatOpening(true);
        try {
            const { data } = await chatApi.createOrGet(profile.id);
            router.push(`/chat/${data.chat_id}`);
        } catch {
            toast.error(t('common.error_generic'));
        } finally {
            setChatOpening(false);
        }
    };

    if (!profile) return null;

    const visitWebsiteHref = `https://expertvisits.com/u/${profile.username}`;
    const visitWebsiteBtnStyle = {
        background: 'rgba(255,255,255,0.95)',
        color: '#111',
        fontWeight: 600,
        border: 'none',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        borderRadius: '10px',
    };

    const renderVisitWebsiteButton = (extraStyle = {}) => (
        <Button type="default" style={{ ...visitWebsiteBtnStyle, ...extraStyle }}>
            {t('widgets.visit_website') || 'Vebsayta Keçid Et'}
        </Button>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.coverContainer}>
                    {profile.cover_image ? (
                        <img src={profile.cover_image} className={styles.coverImage} alt="Cover" />
                    ) : (
                        <div className={styles.defaultCover} style={{ background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' }} />
                    )}

                    {profile.website_active ? (
                        <div className={styles.visitOnCover}>
                            <a href={visitWebsiteHref} target="_blank" rel="noopener noreferrer">
                                {renderVisitWebsiteButton()}
                            </a>
                        </div>
                    ) : null}
                </div>

                <div className={styles.info}>
                    {profile.website_active ? (
                        <div className={styles.visitMobile}>
                            <a href={visitWebsiteHref} target="_blank" rel="noopener noreferrer">
                                {renderVisitWebsiteButton({ width: '100%' })}
                            </a>
                        </div>
                    ) : null}
                    <div className={styles.avatarContainer}>
                        <Avatar user={profile} size={85} className={styles.avatar} />
                    </div>

                    <div className={styles.names}>
                        <h1>{profile.first_name} {profile.last_name}</h1>
                        <p className={styles.subtitle}>@{profile.username} • {
                            profile.profession_sub_category?.[`profession_${i18n.language}`] 
                            || profile.profession_sub_category?.[`name_${i18n.language}`] 
                            || profile.profession_sub_category?.profession_az 
                            || profile.profession_sub_category?.name_az 
                            || ''
                        }</p>

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
                                {profile.connection_pending_in ? (
                                    <Button type="primary" onClick={handleFollow}>
                                        {profile.incoming_connection_request_id
                                            ? t('inbox.accept')
                                            : t('widgets.pending_request')}
                                    </Button>
                                ) : profile.connection_pending_out ? (
                                    <Button type="default" onClick={handleFollow}>
                                        {profile.outgoing_connection_request_id
                                            ? t('widgets.cancel_request')
                                            : t('widgets.pending_request')}
                                    </Button>
                                ) : (
                                    <Button
                                        type={isFollowing ? "default" : "primary"}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? t('public_profile.unfollow') : t('public_profile.follow')}
                                    </Button>
                                )}
                                <Button
                                    type="default"
                                    onClick={openChatWithUser}
                                    disabled={chatOpening}
                                >
                                    {t('inbox.message_user')}
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
                    onBack={() => setIsBookingView(false)}
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
