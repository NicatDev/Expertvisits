"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, FileText, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import LegalModal from './LegalModal';

const Footer = () => {
    const { t, i18n } = useTranslation('common');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'privacy' });

    const openModal = (e, type) => {
        e.preventDefault();
        setModalConfig({ isOpen: true, type });
    };

    const isAz = i18n.language === 'az';

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {/* Brand / About */}
                <div className={styles.column}>
                    <h4>Expert Visits</h4>
                    <p>{isAz ? "Dünya üzrə mütəxəssisləri fürsətlərlə birləşdirir. Təcrübəni paylaş, testlər həll et və inkişaf et." : "Connecting professionals with opportunities worldwide. Share your expertise, take quizzes, and grow."}</p>
                </div>

                {/* Legal */}
                <div className={styles.column}>
                    <h4>{isAz ? "Hüquqi" : "Legal"}</h4>
                    <a href="#" onClick={(e) => openModal(e, 'privacy')}>{isAz ? "Məxfilik siyasəti" : "Privacy Policy"}</a>
                    <a href="#" onClick={(e) => openModal(e, 'terms')}>{isAz ? "İstifadə Şərtləri" : "Terms of Service"}</a>
                </div>

                {/* Support */}
                <div className={styles.column}>
                    <h4>{isAz ? "Dəstək" : "Support"}</h4>
                    <Link href="/companies"><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={14} /> {isAz ? "Şirkətlər" : "Companies"}</span></Link>
                    <Link href="/vacancies">{isAz ? "Vakansiyalar" : "Vacancies"}</Link>
                    <Link href="/experts">{isAz ? "Ekspertlər" : "Experts"}</Link>
                </div>

                {/* Connect */}
                <div className={styles.column}>
                    <h4>{isAz ? "Bizimlə qalın" : "Stay Connected"}</h4>
                    <p style={{fontSize: '14px', color: '#666', lineHeight: '1.6'}}>
                        {isAz ? "Platformadakı yenilikləri ilk hiss edən siz olun." : "Be the first to know about platform updates."}
                    </p>
                </div>
            </div>

            <div className={styles.bottomBar}>
                <div>
                    &copy; {new Date().getFullYear()} Expert Visits. {isAz ? "Bütün hüquqlar qorunur." : "All rights reserved."}
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
