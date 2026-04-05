'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { buildPortfolioNavLinks } from '@/lib/buildPortfolioNavLinks';
import styles from '../styles/template3.module.scss';

export default function Navbar({ data, user }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { t, i18n } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);

    const username = user?.user?.username || '';
    const fullName = `${user?.user?.first_name || ''} ${user?.user?.last_name || ''}`.trim() || username;

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = buildPortfolioNavLinks(user, t);

    const toggleLanguage = (lang) => {
        document.cookie = `i18next=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('i18nextLng', lang);
        window.location.reload();
    };

    if (!isMounted) return null;

    const currentLang = i18n.resolvedLanguage;

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.navContainer}>
                <Link href={`/${username}`} className={styles.logo}>
                    {fullName}<span>.</span>
                </Link>

                <div className={styles.desktopNav}>
                    {navLinks.map((link) => (
                        <Link 
                            key={link.path} 
                            href={link.path}
                            className={`${styles.navLink} ${pathname === link.path ? styles.active : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => toggleLanguage('en')} style={{ background: 'none', border: 'none', color: currentLang === 'en' ? '#f59e0b' : '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: currentLang === 'en' ? '700' : '500' }}>EN</button>
                        <span style={{ color: '#475569' }}>/</span>
                        <button onClick={() => toggleLanguage('az')} style={{ background: 'none', border: 'none', color: currentLang === 'az' ? '#f59e0b' : '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: currentLang === 'az' ? '700' : '500' }}>AZ</button>
                    </div>
                    
                    <button 
                        className={styles.mobileMenuButton}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className={styles.mobileNav}>
                        {navLinks.map((link) => (
                            <Link 
                                key={link.path} 
                                href={link.path}
                                className={`${styles.mobileNavLink} ${pathname === link.path ? styles.active : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
