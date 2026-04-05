"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { accounts, interactions } from '@/lib/api';
import { connectionsApi } from '@/lib/api/connections';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/i18n/client';
import { toast } from 'react-toastify';

const PublicProfileContext = createContext();

export const PublicProfileProvider = ({ children }) => {
    const params = useParams();
    const { username } = params;
    const { user: currentUser } = useAuth();
    const { t } = useTranslation('common');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const loadProfile = useCallback(async (uName) => {
        setLoading(true);
        try {
            const res = await accounts.getUser(uName);
            const targetUser = res.data;

            if (!targetUser) {
                setProfile(null);
                setLoading(false);
                return;
            }

            setProfile(targetUser);
            setIsFollowing(targetUser.is_following || false);
            setFollowersCount(targetUser.followers_count || 0);
            setFollowingCount(targetUser.following_count || 0);
        } catch (err) {
            console.error("Load profile failed", err);
            setError(err);
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
                await interactions.unfollowUser(profile.username);
                await loadProfile(profile.username);
                return;
            }
            if (profile.connection_pending_out && profile.outgoing_connection_request_id) {
                await connectionsApi.cancel(profile.outgoing_connection_request_id);
                await loadProfile(profile.username);
                return;
            }
            if (profile.connection_pending_in) {
                toast.info(t('inbox.pending_in_hint'));
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
        </PublicProfileContext.Provider>
    );
};

export const usePublicProfile = () => useContext(PublicProfileContext);
