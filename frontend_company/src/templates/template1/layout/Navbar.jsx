"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { mediaUrl } from '@/lib/mediaUrl';
import styles from '../styles/navbar.module.scss';
import { Menu, X } from 'lucide-react';

export default function Navbar({ company, companySlug, hasVacancies, visibility }) {
    const { t, i18n } = useTranslation();
    const pathname = usePathname();
    const [drawer, setDrawer] = useState(false);

    const services = company?.services || [];
    const projects = company?.company_projects || [];
    const partners = company?.partners || [];
    const v = visibility || {};

    const items = [
        { href: `/${companySlug}/about`, label: t('nav.about'), show: Boolean(v.about_page) },
        {
            href: `/${companySlug}/services`,
            label: t('nav.services'),
            show: Boolean(v.services_page) && services.length > 0,
        },
        {
            href: `/${companySlug}/projects`,
            label: t('nav.projects'),
            show: Boolean(v.projects_page) && projects.length > 0,
        },
        {
            href: `/${companySlug}/partners`,
            label: t('nav.partners'),
            show: Boolean(v.partners_page) && partners.length > 0,
        },
        {
            href: `/${companySlug}/vacancies`,
            label: t('nav.vacancies'),
            show: Boolean(v.vacancies_page) && hasVacancies,
        },
        {
            href: `/${companySlug}/contact`,
            label: t('nav.contact'),
            show: Boolean(v.contact_page),
        },
    ].filter((x) => x.show);

    const pathActive = (href) => pathname === href;

    const switchLang = (lng) => {
        i18n.changeLanguage(lng);
        document.cookie = `i18next=${lng}; path=/; max-age=31536000; SameSite=Lax`;
        try {
            localStorage.setItem('i18nextLng', lng);
        } catch (_) { /* ignore */ }
        window.location.reload();
    };

    const logoSrc = mediaUrl(company?.logo);

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <Link href={`/${companySlug}`} className={styles.brand} aria-label={company?.name}>
                    {logoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoSrc} alt="" className={styles.logoImg} width={40} height={40} />
                    ) : (
                        <div className={styles.logoImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>
                            {company?.name?.slice(0, 2)?.toUpperCase() || 'Co'}
                        </div>
                    )}
                    <span className={styles.brandName}>{company?.name}</span>
                </Link>

                <nav className={styles.nav} aria-label="Main">
                    {items.map((it) => (
                        <Link
                            key={it.href}
                            href={it.href}
                            className={`${styles.navLink} ${pathActive(it.href) ? styles.navLinkActive : ''}`}
                        >
                            {it.label}
                        </Link>
                    ))}
                    <div className={styles.lang}>
                        <button
                            type="button"
                            className={`${styles.langBtn} ${i18n.language?.startsWith('az') ? styles.langBtnOn : ''}`}
                            onClick={() => switchLang('az')}
                        >
                            {t('nav.langAz')}
                        </button>
                        <button
                            type="button"
                            className={`${styles.langBtn} ${i18n.language?.startsWith('en') ? styles.langBtnOn : ''}`}
                            onClick={() => switchLang('en')}
                        >
                            {t('nav.langEn')}
                        </button>
                    </div>
                </nav>

                <button
                    type="button"
                    className={styles.burger}
                    aria-label={t('nav.openMenu')}
                    aria-expanded={drawer}
                    onClick={() => setDrawer((v) => !v)}
                >
                    {drawer ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            <div className={`${styles.drawer} ${drawer ? styles.drawerOpen : ''}`}>
                {items.map((it) => (
                    <Link key={it.href} href={it.href} className={styles.drawerLink} onClick={() => setDrawer(false)}>
                        {it.label}
                    </Link>
                ))}
                <div style={{ display: 'flex', gap: 8, padding: '0.5rem 0.75rem' }}>
                    <button type="button" className={`${styles.langBtn} ${i18n.language?.startsWith('az') ? styles.langBtnOn : ''}`} onClick={() => switchLang('az')}>
                        {t('nav.langAz')}
                    </button>
                    <button type="button" className={`${styles.langBtn} ${i18n.language?.startsWith('en') ? styles.langBtnOn : ''}`} onClick={() => switchLang('en')}>
                        {t('nav.langEn')}
                    </button>
                </div>
            </div>
        </header>
    );
}
