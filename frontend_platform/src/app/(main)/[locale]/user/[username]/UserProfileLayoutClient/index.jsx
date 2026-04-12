"use client";
import React from 'react';
import { PublicProfileProvider } from '../context';
import ProfileHeader from '../components/ProfileHeader';
import ProfileTabs from '../components/ProfileTabs';
import { useParams } from 'next/navigation';
import styles from './style.module.scss';

// We can define a layout component that wraps content
export default function UserProfileLayoutClient({ children }) {
    const params = useParams();
    const { username } = params;

    return (
        <PublicProfileProvider>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <ProfileHeader />
                <ProfileTabs username={username} />
                <div style={{ borderRadius: '8px', minHeight: '400px' }}>
                    {children}
                </div>
            </div>
        </PublicProfileProvider>
    );
}
