'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './styles.module.scss';
import Button from '../../ui/Button';
import { Search, Globe, User, LogOut, Menu, X, ChevronDown, Bell, MessageCircle } from 'lucide-react';
import LanguageSwitcher from '../../advanced/LanguageSwitcher';
import { useTranslation } from '@/i18n/client';
import { toast } from 'react-toastify';
import TemplateSelectionModal from '../../widgets/PromoBanner/TemplateSelectionModal';
import { useInboxSocket } from '@/lib/contexts/InboxSocketContext';

const Navigation = () => {
    const { t } = useTranslation('common');
    const { user, logout } = useAuth();
    const { notificationUnread, chatUnread } = useInboxSocket();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    
    const [websiteData, setWebsiteData] = useState(null);
    const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                    <Image src="/logo.png" alt="Expert Visits" width={40} height={40} priority unoptimized />
                    <span className={styles.brandName}>Expert Visits</span>
                </Link>

                {/* Center: Desktop Menu */}
                <div className={styles.centerMenu}>
                    <Link href="/" className={styles.navLink} suppressHydrationWarning>{t('nav.home')}</Link>
                    <Link href="/experts" className={styles.navLink} suppressHydrationWarning>{t('nav.experts')}</Link>
                    <Link href="/vacancies" className={styles.navLink} suppressHydrationWarning>{t('nav.vacancies')}</Link>
                    <Link href="/companies" className={styles.navLink} suppressHydrationWarning>{t('nav.companies')}</Link>
                    
                  
                </div>

                {/* Right: Actions */}
                <div className={styles.actions}>
                    {/* Create Website Button */}
                    <div className={styles.desktopOnly}>
                        <Button 
                            onClick={handleWebsiteClick}
                            style={{ 
                                background: websiteData?.is_active ? 'rgba(79, 70, 229, 0.1)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: websiteData?.is_active ? '#4f46e5' : '#fff',
                                border: websiteData?.is_active ? '1px solid #4f46e5' : 'none',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                padding: '8px 16px',
                                fontSize: '13px'
                            }}
                        >
                            {websiteData?.is_active ? (t('widgets.manage_website') || 'Mənim Vebsaytım') : (t('widgets.create_website') || 'Öz vebsaytını yarat')}
                        </Button>
                    </div>

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {user ? (
                        <div className={styles.inboxIcons}>
                            <Link href="/notifications" className={styles.inboxIconLink} aria-label={t('inbox.notifications')}>
                                <span className={styles.inboxIconWrap}>
                                    <Bell size={22} />
                                    {notificationUnread > 0 ? (
                                        <span className={styles.inboxBadge}>
                                            {notificationUnread > 99 ? '99+' : notificationUnread}
                                        </span>
                                    ) : null}
                                </span>
                            </Link>
                            <Link href="/chat" className={styles.inboxIconLink} aria-label={t('inbox.chat')}>
                                <span className={styles.inboxIconWrap}>
                                    <MessageCircle size={22} />
                                    {chatUnread > 0 ? (
                                        <span className={styles.inboxBadge}>
                                            {chatUnread > 99 ? '99+' : chatUnread}
                                        </span>
                                    ) : null}
                                </span>
                            </Link>
                        </div>
                    ) : null}

                    {/* Auth Dropdown */}
                    <div className={styles.dropdownWrapper}
                        ref={userMenuRef}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{ cursor: 'pointer' }}>

                        {user ? (
                            <button className={styles.iconBtn}>
                                {user?.avatar_compressed || user?.avatar ?
                                    <Image src={user?.avatar_compressed || user?.avatar} width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" unoptimized />
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
                        <Link href="/experts" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>{t('nav.experts')}</Link>
                        <Link href="/vacancies" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>{t('nav.vacancies')}</Link>
                        <Link href="/companies" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>{t('nav.companies')}</Link>
                        {user ? (
                            <>
                                <Link href="/notifications" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>
                                    {t('inbox.notifications')}
                                    {notificationUnread > 0 ? ` (${notificationUnread > 99 ? '99+' : notificationUnread})` : ''}
                                </Link>
                                <Link href="/chat" onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>
                                    {t('inbox.chat')}
                                    {chatUnread > 0 ? ` (${chatUnread > 99 ? '99+' : chatUnread})` : ''}
                                </Link>
                            </>
                        ) : null}
                        <div onClick={(e) => { handleWebsiteClick(e); setIsMenuOpen(false); }} className={styles.mobileNavAction} style={{ cursor: 'pointer', padding: '12px 0', borderTop: '1px solid #eee' }}>
                           {websiteData?.is_active ? (t('widgets.manage_website') || 'Mənim Vebsaytım') : (t('widgets.create_website') || 'Veb-saytını yarat')}
                        </div>
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
