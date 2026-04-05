"use client";
import React from 'react';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import styles from './mainLayout.module.scss';

export default function MainLayout({ children }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Navigation />
            <main className={styles.main}>{children}</main>
            <Footer />
        </div>
    );
}
