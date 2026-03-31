"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, FileText, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import LegalModal from './LegalModal';

const Footer = () => {
    const { t, i18n } = useTranslation();
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'privacy' });

    const openModal = (e, type) => {
        e.preventDefault();
        setModalConfig({ isOpen: true, type });
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {/* Brand / About */}
                <div className={styles.column}>
                    <h4>Expert Visits</h4>
                    <p>{t('footer.description')}</p>
                </div>

                {/* Legal */}
                <div className={styles.column}>
                    <h4>{t('footer.legal')}</h4>
                    <a href="#" onClick={(e) => openModal(e, 'privacy')}>{t('footer.privacy')}</a>
                    <a href="#" onClick={(e) => openModal(e, 'terms')}>{t('footer.terms')}</a>
                </div>

                {/* Support */}
                <div className={styles.column}>
                    <h4>{t('footer.support')}</h4>
                    <Link href="/companies"><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={14} /> {t('footer.companies')}</span></Link>
                    <Link href="/vacancies">{t('footer.vacancies')}</Link>
                    <Link href="/experts">{t('footer.experts')}</Link>
                </div>

                {/* Connect */}
                <div className={styles.column}>
                    <h4>{t('footer.stay_connected')}</h4>
                    <p style={{fontSize: '14px', color: '#666', lineHeight: '1.6'}}>
                        {t('footer.updates_desc').split('expertvisits.com/u/').map((part, index, array) => (
                            <React.Fragment key={index}>
                                {part}
                                {index < array.length - 1 && (
                                    <Link href={`/u/${i18n.language || 'en'}/`} style={{ color: '#1890ff', fontWeight: '500' }}>
                                        expertvisits.com/u/
                                    </Link>
                                )}
                            </React.Fragment>
                        ))}
                    </p>
                </div>
            </div>

            <div className={styles.bottomBar}>
                <div>
                    &copy; {new Date().getFullYear()} Expert Visits. {t('footer.rights_reserved')}
                </div>
                <div className={styles.socials}>
                    {/* Socials deleted as requested */}
                </div>
            </div>

            <LegalModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ isOpen: false, type: 'privacy' })} 
                type={modalConfig.type} 
            />
        </footer>
    );
};

export default Footer;
