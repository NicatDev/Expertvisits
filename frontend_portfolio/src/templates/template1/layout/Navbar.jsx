'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/template1.module.scss';

export default function Navbar({ data, user }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { t, i18n } = useTranslation('translation');
    const [isMounted, setIsMounted] = useState(false);

    const username = user?.user?.username || '';
    const fullName = `${user?.user?.first_name || ''} ${user?.user?.last_name || ''}`.trim() || username;

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: t('nav.home', { defaultValue: 'Home' }), path: `/${username}` },
        ...(user?.articles_count >= 3 ? [{ label: t('portfolio.myWritings', { defaultValue: 'Articles' }), path: `/${username}/articles` }] : []),
        { label: t('nav.contact', { defaultValue: 'Contact' }), path: `/${username}/contact` },
    ];

    const toggleLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    if (!isMounted) return null;

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.navContainer}>
                <Link href={`/${username}`} className={styles.logo}>
                    {fullName || 'Portfolio'}
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
                    <div className={styles.mobileLangSwitcher} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => toggleLanguage('en')} style={{ background: 'none', border: 'none', color: i18n.resolvedLanguage === 'en' ? '#fff' : 'var(--t1-text-light)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: i18n.resolvedLanguage === 'en' ? '600' : '400' }}>EN</button>
                        <span style={{ color: 'var(--t1-text-light)' }}>/</span>
                        <button onClick={() => toggleLanguage('az')} style={{ background: 'none', border: 'none', color: i18n.resolvedLanguage === 'az' ? '#fff' : 'var(--t1-text-light)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: i18n.resolvedLanguage === 'az' ? '600' : '400' }}>AZ</button>
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
            
            <style jsx>{`
                @media (min-width: 768px) {
                    .${styles.mobileLangSwitcher} {
                        display: none !important;
                    }
                }
            `}</style>
        </nav>
    );
}
