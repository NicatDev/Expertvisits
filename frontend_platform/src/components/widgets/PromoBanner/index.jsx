"use client";
import React from 'react';
import styles from './style.module.scss';
import { Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

const PromoBanner = () => {
    const { t } = useTranslation('common');

    return (
        <a 
            href="https://expertvisits.com/builder" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.banner}
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
        </a>
    );
};

export default PromoBanner;
