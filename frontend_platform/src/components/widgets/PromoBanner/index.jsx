"use client";
import React from 'react';
import Link from 'next/link';
import styles from './style.module.scss';
import { Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';

const PromoBanner = () => {
    const { t } = useTranslation('common');
    const { user } = useAuth();

    const guardClick = (e) => {
        if (!user) {
            e.preventDefault();
            toast.info(t('auth.login_required'));
        }
    };

    return (
        <Link
            href="/website-template"
            onClick={guardClick}
            className={styles.banner}
            style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.iconWrapper}>
                <Globe size={24} className={styles.icon} />
            </div>
            <div className={styles.content}>
                <span className={styles.label}>{t('widgets.promo_label')}</span>
                <h4 className={styles.title}>{t('widgets.promo_title')}</h4>
            </div>
            <div className={styles.arrowWrapper}>
                <ArrowRight size={20} className={styles.arrow} />
            </div>
        </Link>
    );
};

export default PromoBanner;
