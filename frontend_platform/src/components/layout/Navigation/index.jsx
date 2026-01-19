import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './styles.module.scss';
import Button from '../../ui/Button';
import { Search, Globe, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';

const Navigation = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [lang, setLang] = useState('EN');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const changeLang = (l) => {
        setLang(l);
        localStorage.setItem('language', l.toLowerCase());
        window.location.reload();
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
                    <Link href="/" className={styles.navLink}>Home</Link>
                    <Link href="/vacancies" className={styles.navLink}>Vacancies</Link>
                    <Link href="/companies" className={styles.navLink}>Companies</Link>
                    <Link href="/services" className={styles.navLink}>Services</Link>
                </div>

                {/* Right: Actions */}
                <div className={styles.actions}>


                    {/* Language Dropdown */}
                    <div className={styles.dropdownWrapper}
                        onMouseEnter={() => setShowLangMenu(true)}
                        onMouseLeave={() => setShowLangMenu(false)}>
                        <button className={styles.iconBtn}>
                            <Globe size={20} />
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{lang}</span>
                            <ChevronDown size={14} />
                        </button>
                        {showLangMenu && (
                            <div className={styles.dropdownMenu}>
                                <button onClick={() => changeLang('AZ')}>AZ</button>
                                <button onClick={() => changeLang('EN')}>EN</button>
                                <button onClick={() => changeLang('RU')}>RU</button>
                            </div>
                        )}
                    </div>

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
                                        <button onClick={() => router.push('/profile')}>Profile</button>
                                        <button onClick={logout} style={{ color: 'red' }}>Logout</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => router.push('/login')}>Login</button>
                                        <button onClick={() => router.push('/register')}>Register</button>
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
            {isMenuOpen && (
                <div className={styles.mobileMenu}>
                    <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                    <Link href="/vacancies" onClick={() => setIsMenuOpen(false)}>Vacancies</Link>
                    <Link href="/companies" onClick={() => setIsMenuOpen(false)}>Companies</Link>
                    <Link href="/services" onClick={() => setIsMenuOpen(false)}>Services</Link>
                </div>
            )}
        </nav>
    );
};

export default Navigation;
