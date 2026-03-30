"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/layout.module.scss';

export default function Footer({ user }) {
    const userLang = user?.user?.language || 'az';
    const { t } = useTranslation(undefined, { lng: userLang });
    const [isMounted, setIsMounted] = useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const profile = user?.user || {};
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;

    if (!isMounted) return null;

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <h3>{fullName}</h3>
                        <p>{profile.profession_sub_category?.profession || 'Professional'}</p>
                        <div className={styles.footerSocial}>
                             <Link href="#"><Globe size={20} /></Link>
                             <Link href="#"><Mail size={20} /></Link>
                             <Link href="#"><Phone size={20} /></Link>
                        </div>
                    </div>
                    
                    <div className={styles.footerLinks}>
                        <h4>{t('nav.explore') || 'Menu'}</h4>
                        <ul>
                            <li><Link href={`/${profile.username}`}>{t('nav.home')}</Link></li>
                            <li><Link href={`/${profile.username}/articles`}>{t('portfolio.myWritings')}</Link></li>
                            <li><Link href={`/${profile.username}/contact`}>{t('nav.contact')}</Link></li>
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
