"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

export default function MainLayout({ children }) {
    const router = useRouter();

    useEffect(() => {
        // Basic auth check
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // router.push('/login');
        }
    }, [router]);

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
