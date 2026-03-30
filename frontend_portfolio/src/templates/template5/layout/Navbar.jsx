"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/layout.module.scss';

export default function Navbar({ user }) {
    const { t, i18n } = useTranslation();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    
    const profile = user?.user || {};
    const username = user.username || profile.username || '';
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || username;
    
    const currentLang = i18n.resolvedLanguage || 'az';
    const specialist = profile.profession_sub_category?.[`profession_${currentLang}`] || profile.profession_sub_category?.profession || 'Professional';

    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleLanguage = (lang) => {
        document.cookie = `i18next=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('i18nextLng', lang);
        window.location.reload();
    };

    if (!isMounted) return null;

    const navLinks = [
        { name: t('nav.home'), href: `/${username}` },
        ...(user.articles_count >= 3 ? [{ name: t('portfolio.myWritings'), href: `/${username}/articles` }] : []),
        { name: t('nav.contact'), href: `/${username}/contact` }
    ];

    const isActive = (path) => pathname === path;

    return (
        <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.topBar}>
               <div className={styles.container}>
                   <div className={styles.topBarContent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                       <div className={styles.contactInfo}>
                           {profile.phone_number && (
                               <div className={styles.topItem}>
                                   <Phone size={14} /> <span>{profile.phone_number}</span>
                               </div>
                           )}
                           {profile.email && (
                               <div className={styles.topItem}>
                                   <Mail size={14} /> <span>{profile.email}</span>
                               </div>
                           )}
                       </div>
                       <div className={styles.langSwitcher} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <button 
                               onClick={() => toggleLanguage('az')} 
                               style={{ background: 'none', border: 'none', color: currentLang === 'az' ? 'var(--t5-primary)' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: currentLang === 'az' ? '700' : '400', transition: 'all 0.2s' }}
                           >AZ</button>
                           <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>|</span>
                           <button 
                               onClick={() => toggleLanguage('en')} 
                               style={{ background: 'none', border: 'none', color: currentLang === 'en' ? 'var(--t5-primary)' : '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: currentLang === 'en' ? '700' : '400', transition: 'all 0.2s' }}
                           >EN</button>
                       </div>
                   </div>
               </div>
            </div>
            
            <nav className={styles.nav}>
                <div className={styles.container}>
                    <Link href={`/${username}`} className={styles.logo}>
                        {fullName}
                    </Link>

                    {/* Desktop Menu */}
                    <ul className={styles.desktopMenu}>
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link 
                                    href={link.href}
                                    className={isActive(link.href) ? styles.active : ''}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Mobile Toggle */}
                    <button className={styles.mobileToggle} onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
                
                {/* Mobile Menu */}
                {menuOpen && (
                    <div className={styles.mobileMenu}>
                        <ul>
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                            <li className={styles.mobileLangSw}>
                                <div style={{ display: 'flex', gap: '12px', padding: '16px 0', borderTop: '1px solid #eee', marginTop: '8px' }}>
                                    <button onClick={() => toggleLanguage('az')} style={{ background: 'none', border: 'none', color: currentLang === 'az' ? 'var(--t5-primary)' : '#666', fontWeight: currentLang === 'az' ? '700' : '400' }}>AZ</button>
                                    <button onClick={() => toggleLanguage('en')} style={{ background: 'none', border: 'none', color: currentLang === 'en' ? 'var(--t5-primary)' : '#666', fontWeight: currentLang === 'en' ? '700' : '400' }}>EN</button>
                                </div>
                            </li>
                        </ul>
                    </div>
                )}
            </nav>
        </header>
    );
}
