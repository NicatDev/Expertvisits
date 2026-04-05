'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, FileText, Mail, Briefcase, FolderKanban } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { buildPortfolioNavLinks } from '@/lib/buildPortfolioNavLinks';
import styles from '../styles/template4.module.scss';

export default function Navbar({ user }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { t, i18n } = useTranslation('translation');
    const [isMounted, setIsMounted] = useState(false);

    const username = user?.user?.username || '';
    const fullName = `${user?.user?.first_name || ''} ${user?.user?.last_name || ''}`.trim() || username;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const navLinks = useMemo(() => {
        const base = buildPortfolioNavLinks(user, t);
        return base.map((l) => {
            let icon = <Home size={20} />;
            if (l.path.endsWith('/services')) icon = <Briefcase size={20} />;
            else if (l.path.endsWith('/projects')) icon = <FolderKanban size={20} />;
            else if (l.path.endsWith('/articles')) icon = <FileText size={20} />;
            else if (l.path.endsWith('/contact')) icon = <Mail size={20} />;
            return { ...l, icon };
        });
    }, [user, t]);

    const toggleLanguage = (lang) => {
        document.cookie = `i18next=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('i18nextLng', lang);
        window.location.reload();
    };

    if (!isMounted) return null;

    return (
        <>
            <div className={styles.mobileHeader}>
                <Link href={`/${username}`} className={styles.logo}>
                    {user?.user?.first_name || 'My'} <span>{user?.user?.last_name || 'Portfolio'}</span>
                </Link>
                <button 
                    className={styles.mobileMenuButton}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <nav className={`${styles.sidebar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
                <div className={styles.sidebarContainer}>
                    <Link href={`/${username}`} className={styles.logo}>
                        {user?.user?.first_name || 'My'} <span>{user?.user?.last_name || 'Portfolio'}</span>
                    </Link>

                    <div className={styles.desktopNav}>
                        {navLinks.map((link) => (
                            <Link 
                                key={link.path} 
                                href={link.path}
                                className={`${styles.navLink} ${pathname === link.path ? styles.active : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className={styles.sidebarFooter}>
                        <div className={styles.langSwitcher}>
                            <button 
                                onClick={() => toggleLanguage('en')} 
                                className={i18n.resolvedLanguage === 'en' ? styles.activeLang : ''}
                            >EN</button>
                            <button 
                                onClick={() => toggleLanguage('az')} 
                                className={i18n.resolvedLanguage === 'az' ? styles.activeLang : ''}
                            >AZ</button>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
