"use client";

import { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { submitCompanyContact } from '@/lib/api/company';
import styles from '../styles/contact.module.scss';

export default function ContactForm({ companySlug }) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        setOk(false);
        setSending(true);
        try {
            await submitCompanyContact(companySlug, { name, email, subject, message });
            setOk(true);
            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
        } catch (error) {
            const d = error?.response?.data?.detail;
            setErr(typeof d === 'string' ? d : t('contact.error'));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.wrap} id="contact">
            <div className={styles.box}>
                <h2 className={styles.title}>{t('contact.title')}</h2>
                <p className={styles.sub}>{t('contact.subtitle')}</p>
                <form className={styles.form} onSubmit={onSubmit}>
                    <div className={styles.row2}>
                        <div>
                            <label className={styles.label} htmlFor="cf-name">{t('contact.name')}</label>
                            <input id="cf-name" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                        </div>
                        <div>
                            <label className={styles.label} htmlFor="cf-email">{t('contact.email')}</label>
                            <input id="cf-email" type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>
                    </div>
                    <div>
                        <label className={styles.label} htmlFor="cf-sub">{t('contact.subject')}</label>
                        <input id="cf-sub" className={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} required />
                    </div>
                    <div>
                        <label className={styles.label} htmlFor="cf-msg">{t('contact.message')}</label>
                        <textarea id="cf-msg" className={styles.textarea} value={message} onChange={(e) => setMessage(e.target.value)} required />
                    </div>
                    <button type="submit" className={styles.submit} disabled={sending}>
                        {sending ? t('contact.sending') : t('contact.submit')}
                    </button>
                    {ok ? <p className={styles.msgOk}>{t('contact.success')}</p> : null}
                    {err ? <p className={styles.msgErr}>{err}</p> : null}
                </form>
            </div>
        </div>
    );
}
