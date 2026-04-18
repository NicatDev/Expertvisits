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
            <div className={styles.shell}>
                <ProfileHeader />
                <ProfileTabs username={username} />
                <div className={styles.tabContentOut}>
                    {children}
                </div>
            </div>
        </PublicProfileProvider>
    );
}
