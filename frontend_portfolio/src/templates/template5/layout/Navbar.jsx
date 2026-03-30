"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/layout.module.scss';

export default function Navbar({ user }) {
    const userLang = user?.user?.language || 'az';
    const { t } = useTranslation(undefined, { lng: userLang });
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    
    const profile = user?.user || {};
    const username = profile.username;
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || username;

    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isMounted) return null;

    const navLinks = [
        { name: t('nav.home'), href: `/${username}` },
        { name: t('portfolio.myWritings'), href: `/${username}/articles` },
        { name: t('nav.contact'), href: `/${username}/contact` }
    ];

    const isActive = (path) => pathname === path;

    return (
        <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.topBar}>
               <div className={styles.container}>
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
                        </ul>
                    </div>
                )}
            </nav>
        </header>
    );
}
