"use client";
import React from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import LanguageSwitcher from '@/components/advanced/LanguageSwitcher';
import styles from './style.module.scss';

export default function AuthLayout({ children }) {
    return (
        <div className={styles.authPageWrapper}>
            <header className={styles.authHeader}>
                <div className={styles.container}>
                    <Link href="/" className={styles.logo}>
                        <BrandLogo priority />
                        <span className={styles.brandName}>Expert Visits</span>
                    </Link>
                    <LanguageSwitcher />
                </div>
            </header>
            <main className={styles.authMain}>
                {children}
            </main>
        </div>
    );
}
