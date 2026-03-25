'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './styles.module.scss';
import Button from '../../ui/Button';
import { Search, Globe, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import LanguageSwitcher from '../../advanced/LanguageSwitcher';
import { useTranslation } from '@/i18n/client';
import { toast } from 'react-toastify';
import TemplateSelectionModal from '../../widgets/PromoBanner/TemplateSelectionModal';

const Navigation = () => {
    const { t } = useTranslation('common');
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    
    const [websiteData, setWebsiteData] = useState(null);
    const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            // Lazy load the websites API to avoid unnecessary initial bundle size
            import('@/lib/api/websites').then(({ websites_api }) => {
                websites_api.getTemplate()
                    .then(res => setWebsiteData(res.data))
                    .catch(err => console.error("Nav website fetch failed", err));
            });
        } else {
            setWebsiteData(null);
        }
    }, [user]);

    const handleWebsiteClick = (e) => {
        e.preventDefault();
        if (!user) {
            toast.info(t('auth.login_required') || 'Giriş etməlisiniz');
            return;
        }
        setIsWebsiteModalOpen(true);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                {/* Left: Logo */}
                <Link href="/" className={styles.logo}>
                    <Image src="/logo.png" alt="Expert Visits" width={40} height={40} />
                    <span className={styles.brandName}>Expert Visits</span>
                </Link>

                {/* Center: Desktop Menu */}
                <div className={styles.centerMenu}>
                    <Link href="/" className={styles.navLink} suppressHydrationWarning>{t('nav.home')}</Link>
                    <Link href="/experts" className={styles.navLink} suppressHydrationWarning>{t('nav.experts')}</Link>
                    <Link href="/vacancies" className={styles.navLink} suppressHydrationWarning>{t('nav.vacancies')}</Link>
                    <Link href="/companies" className={styles.navLink} suppressHydrationWarning>{t('nav.companies')}</Link>
                    
                    <a 
                        href="#" 
                        onClick={handleWebsiteClick} 
                        className={styles.navLink} 
                        style={{ color: '#6366f1', fontWeight: '700' }}
                        suppressHydrationWarning
                    >
                        {websiteData?.is_active 
                            ? (t('widgets.manage_website') || 'Mənim Vebsaytım') 
                            : (t('widgets.create_website') || 'Öz vebsaytını yarat')
                        }
                    </a>
                </div>

                {/* Right: Actions */}
                <div className={styles.actions}>
                    {/* Language Dropdown */}
                    <LanguageSwitcher />

                    {/* Auth Dropdown */}
                    <div className={styles.dropdownWrapper}
                        onMouseEnter={() => setShowUserMenu(true)}
                        onMouseLeave={() => setShowUserMenu(false)}>

                        {user ? (
                            <button className={styles.iconBtn}>
                                {user?.avatar ?
                                    <Image src={user?.avatar} width={28} height={28} style={{ borderRadius: '50%' }} alt="Avatar" />
                                    : <User size={24} />
                                }
                            </button>
                        ) : (
                            <button className={styles.iconBtn}>
                                <div style={{ background: '#f0f2f5', padding: '6px', borderRadius: '50%' }}>
                                    <User size={20} />
                                </div>
                            </button>
                        )}

                        {showUserMenu && (
                            <div className={styles.dropdownMenu} style={{ right: 0, minWidth: '150px' }}>
                                {user ? (
                                    <>
                                        <button onClick={() => router.push('/profile')} suppressHydrationWarning>{t('nav.profile')}</button>
                                        <button onClick={logout} style={{ color: 'red' }} suppressHydrationWarning>{t('auth.logout')}</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => router.push('/login')} suppressHydrationWarning>{t('auth.login')}</button>
                                        <button onClick={() => router.push('/register')} suppressHydrationWarning>{t('auth.register')}</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className={styles.mobileToggle} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {
                isMenuOpen && (
                    <div className={styles.mobileMenu}>
                        <Link href="/" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>{t('nav.home')}</Link>
                        <Link href="/vacancies" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>{t('nav.vacancies')}</Link>
                        <Link href="/companies" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>{t('nav.companies')}</Link>
                        <a 
                            href="#" 
                            onClick={(e) => { setIsMenuOpen(false); handleWebsiteClick(e); }} 
                            style={{ color: '#6366f1', fontWeight: '700', padding: '12px 0' }}
                            suppressHydrationWarning
                        >
                            {websiteData?.is_active 
                                ? (t('widgets.manage_website') || 'Mənim Vebsaytım') 
                                : (t('widgets.create_website') || 'Öz vebsaytını yarat')
                            }
                        </a>
                    </div>
                )
            }

            {isWebsiteModalOpen && (
                <TemplateSelectionModal 
                    isOpen={isWebsiteModalOpen} 
                    onClose={() => setIsWebsiteModalOpen(false)} 
                />
            )}
        </nav >
    );
};

export default Navigation;
