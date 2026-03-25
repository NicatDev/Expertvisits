'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from '../styles/template1.module.scss';

export default function Navbar({ data, user }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const username = user?.user?.username || '';
    const fullName = `${user?.user?.first_name || ''} ${user?.user?.last_name || ''}`.trim() || username;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Home', path: `/${username}` },
        { label: 'Articles', path: `/${username}/articles` },
        { label: 'Contact', path: `/${username}/contact` },
    ];

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

                <button 
                    className={styles.mobileMenuButton}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

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
