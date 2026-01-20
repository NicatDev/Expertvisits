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

export default function LanguageSwitcher() {
    const { i18n } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const currentLang = languages.find(l => l.code === i18n.resolvedLanguage) || languages[0];

    const handleLanguageChange = (code) => {
        i18n.changeLanguage(code);
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
