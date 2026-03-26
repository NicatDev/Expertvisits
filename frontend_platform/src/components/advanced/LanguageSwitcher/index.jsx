'use client';

import { useTranslation } from '@/i18n/client';
import { useState, useRef, useEffect } from 'react';
import styles from './style.module.scss';
import { Globe } from 'lucide-react';

const languages = [
    { code: 'az', label: 'AZ' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' }
];

import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const pathname = usePathname();
    const router = useRouter();

    const currentLang = languages.find(l => l.code === i18n.resolvedLanguage) || languages[0];

    const handleLanguageChange = (code) => {
        i18n.changeLanguage(code);
        document.cookie = `i18next=${code}; path=/; max-age=31536000`; // Ensure cookie is saved

        if (pathname) {
            const segments = pathname.split('/');
            if (['az', 'en', 'ru'].includes(segments[1])) {
                segments[1] = code;
            } else {
                segments.splice(1, 0, code);
            }
            const newPath = segments.join('/') || '/';
            router.push(newPath);
            router.refresh(); // Force server components to re-render with new locale
        }
        
        setIsOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Change Language"
            >
                <Globe size={20} />
                <span className={styles.currentLabel} suppressHydrationWarning>{currentLang.label}</span>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            className={`${styles.option} ${i18n.resolvedLanguage === lang.code ? styles.active : ''}`}
                            onClick={() => handleLanguageChange(lang.code)}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
