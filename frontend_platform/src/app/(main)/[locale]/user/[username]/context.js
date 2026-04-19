"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import { accounts, interactions } from '@/lib/api';
import { connectionsApi } from '@/lib/api/connections';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useInboxSocket } from '@/lib/contexts/InboxSocketContext';
import { useTranslation } from '@/i18n/client';
import { toast } from 'react-toastify';
import Sure from '@/components/ui/sure';
import { userProfileUsernameCandidates } from '@/lib/userProfileUsernameCandidates';

const PublicProfileContext = createContext();

export const PublicProfileProvider = ({ children }) => {
    const params = useParams();
    const { username } = params;
    const { user: currentUser } = useAuth();
    const { refreshSummary } = useInboxSocket();
    const { t } = useTranslation('common');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const [sureOpen, setSureOpen] = useState(false);
    const [sureDialog, setSureDialog] = useState({
        message: '',
        confirmVariant: 'primary',
        onConfirm: async () => {},
    });

    const loadProfile = useCallback(async (uName) => {
        setLoading(true);
        let lastErr = null;
        try {
            const candidates = userProfileUsernameCandidates(uName);
            for (const u of candidates) {
                try {
                    const res = await accounts.getUser(u);
                    const targetUser = res.data;

                    if (!targetUser) {
                        continue;
                    }

                    setProfile(targetUser);
                    setIsFollowing(targetUser.is_following || false);
                    setFollowersCount(targetUser.followers_count || 0);
                    setFollowingCount(targetUser.following_count || 0);
                    setError(null);
                    return;
                } catch (err) {
                    lastErr = err;
                    if (err.response?.status !== 404) {
                        console.error('Load profile failed', err);
                        setError(err);
                        return;
                    }
                }
            }
            if (lastErr?.response?.status === 404) {
                notFound();
                return;
            }
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (username && username !== 'undefined') {
            loadProfile(username);
        } else {
            setLoading(false);
        }
    }, [username, loadProfile]);

    const handleFollow = async () => {
        if (!profile || !currentUser) return;
        try {
            if (isFollowing) {
                setSureDialog({
                    message: t('inbox.confirm_disconnect'),
                    confirmVariant: 'danger',
                    onConfirm: async () => {
                        try {
                            await interactions.unfollowUser(profile.username);
                            await loadProfile(profile.username);
                        } catch (err) {
                            console.error(err);
                            toast.error(t('common.error_generic'));
                            throw err;
                        }
                    },
                });
                setSureOpen(true);
                return;
            }
            if (profile.connection_pending_out && profile.outgoing_connection_request_id) {
                setSureDialog({
                    message: t('inbox.confirm_cancel_request'),
                    confirmVariant: 'primary',
                    onConfirm: async () => {
                        try {
                            await connectionsApi.cancel(profile.outgoing_connection_request_id);
                            await refreshSummary();
                            await loadProfile(profile.username);
                        } catch (err) {
                            console.error(err);
                            toast.error(t('common.error_generic'));
                            throw err;
                        }
                    },
                });
                setSureOpen(true);
                return;
            }
            if (profile.connection_pending_in) {
                if (profile.incoming_connection_request_id) {
                    try {
                        await connectionsApi.accept(profile.incoming_connection_request_id);
                        toast.success(t('application_status.accepted'));
                        await refreshSummary();
                        await loadProfile(profile.username);
                    } catch (err) {
                        console.error(err);
                        toast.error(t('common.error_generic'));
                    }
                } else {
                    toast.info(t('inbox.pending_in_hint'));
                }
                return;
            }
            const { data } = await interactions.followUser(profile.username);
            if (data.status === 'pending') {
                await loadProfile(profile.username);
            } else if (data.status === 'connected') {
                await loadProfile(profile.username);
            }
        } catch (err) {
            if (err.response?.status === 409) {
                toast.info(t('inbox.incoming_conflict'));
            } else {
                console.error("Follow action failed", err);
                toast.error(t('common.error_generic'));
            }
        }
    };

    return (
        <PublicProfileContext.Provider value={{
            profile,
            loading,
            error,
            isFollowing,
            followersCount,
            followingCount,
            handleFollow,
            isMe: currentUser && profile && currentUser.username === profile.username,
            currentUser,
            reloadProfile: () => profile && loadProfile(profile.username),
        }}>
            {children}
            <Sure
                open={sureOpen}
                onClose={() => setSureOpen(false)}
                title={t('common.sure_title')}
                message={sureDialog.message}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
                confirmVariant={sureDialog.confirmVariant}
                onConfirm={sureDialog.onConfirm}
            />
        </PublicProfileContext.Provider>
    );
};

export const usePublicProfile = () => useContext(PublicProfileContext);
