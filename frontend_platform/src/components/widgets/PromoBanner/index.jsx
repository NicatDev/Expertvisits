"use client";
import React, { useState } from 'react';
import styles from './style.module.scss';
import { Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

import TemplateSelectionModal from './TemplateSelectionModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';

const PromoBanner = () => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = (e) => {
        e.preventDefault();
        if (!user) {
            toast.info(t('auth.login_required') || 'Giriş etməlisiniz');
            return;
        }
        setIsModalOpen(true);
    };

    return (
        <>
            <div 
                onClick={handleClick}
                className={styles.banner}
                style={{ cursor: 'pointer' }}
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
            </div>
            
            {isModalOpen && (
                <TemplateSelectionModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </>
    );
};

export default PromoBanner;
