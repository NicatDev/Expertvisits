"use client";
import React from 'react';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

export default function MainLayout({ children }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
            <Navigation />
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 0px', width: '100%', flex: 1 }}>
                {children}
            </main>
            <Footer />
        </div>
    );
}
