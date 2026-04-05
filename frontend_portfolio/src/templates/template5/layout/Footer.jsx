"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { buildPortfolioNavLinks } from '@/lib/buildPortfolioNavLinks';
import styles from '../styles/layout.module.scss';

export default function Footer({ user }) {
    const { t, i18n } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const currentLang = i18n.resolvedLanguage || 'az';
    const profile = user?.user || {};
    const username = user.username || profile.username || '';
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || username;
    const specialist = profile.profession_sub_category?.[`profession_${currentLang}`] || profile.profession_sub_category?.profession || 'Professional';

    if (!isMounted) return null;

    const exploreLinks = buildPortfolioNavLinks(user, t);

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <h3>{fullName}</h3>
                        <p>{specialist}</p>
                        <div className={styles.footerSocial}>
                             <Link href={`mailto:${profile.email}`} title="Email"><Mail size={20} /></Link>
                             <Link href={`tel:${profile.phone_number?.replace(/\s/g, '')}`} title="Phone"><Phone size={20} /></Link>
                        </div>
                    </div>
                    
                    <div className={styles.footerLinks}>
                        <h4>{t('nav.explore') || 'Menu'}</h4>
                        <ul>
                            {exploreLinks.map((link) => (
                                <li key={link.path}>
                                    <Link href={link.path}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className={styles.footerContact}>
                        <h4>{t('portfolio.contactMe')}</h4>
                        <ul>
                            {profile.email && (
                                <li>
                                    <Mail size={16} />
                                    <span>{profile.email}</span>
                                </li>
                            )}
                            {profile.phone_number && (
                                <li>
                                    <Phone size={16} />
                                    <span>{profile.phone_number}</span>
                                </li>
                            )}
                            {profile.city && (
                                <li>
                                    <MapPin size={16} />
                                    <span>{profile.city}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
                
                <div className={styles.footerBottom}>
                    <p>© {new Date().getFullYear()} {fullName}. {t('portfolio.allRightsReserved')}</p>
                </div>
            </div>
        </footer>
    );
}
