"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import styles from './style.module.scss';

/** Yalnız konkret söhbət otağı /{locale}/chat/[roomId] — mobil tam ekran; ümumi /chat siyahısında header/footer qalır */
function isChatRoomPath(pathname) {
    if (!pathname) return false;
    return /^\/(az|en|ru)\/chat\/[^/]+/.test(pathname);
}

export default function MainLayout({ children }) {
    const pathname = usePathname();
    const chatImmersive = isChatRoomPath(pathname);

    return (
        <div
            className={chatImmersive ? styles.chatMobileImmersive : undefined}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}
        >
            <Navigation />
            <main className={styles.main}>{children}</main>
            <Footer />
        </div>
    );
}
