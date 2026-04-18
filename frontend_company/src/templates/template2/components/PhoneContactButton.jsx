"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { telHref, whatsappMeUrl } from '@/lib/phoneContact';
import styles from '../styles/contactPage.module.scss';

export default function PhoneContactButton({ phone }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, [open]);

    const wa = whatsappMeUrl(phone);
    const call = telHref(phone);
    if (!phone?.trim() || (!wa && !call)) return null;

    return (
        <div ref={wrapRef} className={styles.block}>
            <div className={styles.blockLabel}>{t('home.phone')}</div>
            <button
                type="button"
                className={styles.phoneBtn}
                aria-expanded={open}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
            >
                <Phone size={18} />
                {phone.trim()}
                <ChevronDown size={16} style={{ opacity: 0.7 }} />
            </button>
            {open ? (
                <div className={styles.phoneMenu} role="menu">
                    {wa ? (
                        <a className={styles.menuLink} href={wa} target="_blank" rel="noopener noreferrer" role="menuitem">
                            <MessageCircle size={18} />
                            {t('contact.whatsapp')}
                        </a>
                    ) : null}
                    {call ? (
                        <a className={styles.menuLink} href={call} role="menuitem">
                            <Phone size={18} />
                            {t('contact.call')}
                        </a>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
