"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { accounts, interactions, services, profiles, business } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';

const PublicProfileContext = createContext();

export const PublicProfileProvider = ({ children }) => {
    const params = useParams();
    const { username } = params;
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Follow State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Additional Data for About Tab mainly, but good to have cached
    // Or we can let specific pages fetch their own data if detail is heavy.
    // Given the previous code fetched EVERYTHING upfront, let's keep it somewhat similar 
    // but maybe lazy load heavy things?
    // Actually, splitting pages allows fetching only what's needed.
    // The "Header" needs profile, followers, following.
    // "About" needs experience, education etc.
    // "Posts" needs posts.
    // "Vacancies" needs vacancies.

    // So Context should primarily provide the User Profile & Follow status (Header info).

    useEffect(() => {
        if (username && username !== 'undefined') {
            loadProfile(username);
        } else {
            setLoading(false);
        }
    }, [username]);

    const loadProfile = async (uName) => {
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
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await interactions.unfollowUser(profile.username);
                setIsFollowing(false);
                setFollowersCount(prev => prev - 1);
            } else {
                await interactions.followUser(profile.username);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (err) {
            console.error("Follow action failed", err);
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
            currentUser
        }}>
            {children}
        </PublicProfileContext.Provider>
    );
};

export const usePublicProfile = () => useContext(PublicProfileContext);
