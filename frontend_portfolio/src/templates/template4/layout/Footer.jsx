'use client';

import React from 'react';
import styles from '../styles/template4.module.scss';
import { Mail } from 'lucide-react';

export default function Footer({ data, user }) {
    const currentYear = new Date().getFullYear();
    const profile = user?.user || {};
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Portfolio';

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <p>&copy; {currentYear} {fullName}. All rights reserved.</p>
                <div className={styles.footerSocials}>
                    {profile.email && (
                        <a href={`mailto:${profile.email}`} className={styles.socialLink}>
                            <Mail size={18} />
                            <span>Say Hello</span>
                        </a>
                    )}
                </div>
            </div>
        </footer>
    );
}
