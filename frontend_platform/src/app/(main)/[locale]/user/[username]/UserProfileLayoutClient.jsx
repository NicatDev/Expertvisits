"use client";
import React from 'react';
import { PublicProfileProvider } from './context';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import { useParams } from 'next/navigation';
import styles from './profile.module.scss'; // Keeping main container style here?

// We can define a layout component that wraps content
export default function UserProfileLayoutClient({ children }) {
    const params = useParams();
    const { username } = params;

    return (
        <PublicProfileProvider>
            {/* We can use the container class from profile.module.scss if we want consistency */}
            {/* But since we removed profile.module.scss in thought process, let's verify if styles exist.
                 The old page.jsx used 'profile.module.scss'. I should keep it or create a layout scss.
             */}
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
