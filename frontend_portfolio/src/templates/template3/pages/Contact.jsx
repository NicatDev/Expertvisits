"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { submitContactForm } from '@/lib/api/portfolio';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/contact.module.scss';

export default function Contact({ user }) {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '', email: '', subject: '', message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const username = user?.user?.username || user?.username;
    const profile = user?.user || {};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await submitContactForm(username, formData);
            setStatus({ type: 'success', message: t('portfolio.msgSuccess') });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.detail || t('portfolio.contactFormError') 
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className={styles.contactLayout}>
            <div className={styles.contactInfo}>
                <h1 className={styles.pageTitle}>{t('portfolio.letsTalk')} <span>{t('portfolio.together')}</span></h1>
                <p className={styles.subtitle}>{t('portfolio.contactPageIntro')}</p>

                <div className={styles.infoCards}>
                    {profile.email && (
                        <div className={styles.infoCard}>
                            <div className={styles.iconBox}><Mail size={24} /></div>
                            <div><h3>{t('portfolio.email')}</h3><p>{profile.email}</p></div>
                        </div>
                    )}
                    {profile.phone_number && (
                        <div className={styles.infoCard}>
                            <div className={styles.iconBox}><Phone size={24} /></div>
                            <div><h3>{t('portfolio.phone')}</h3><p>{profile.phone_number}</p></div>
                        </div>
                    )}
                    {profile.city && (
                        <div className={styles.infoCard}>
                            <div className={styles.iconBox}><MapPin size={24} /></div>
                            <div><h3>{t('portfolio.location')}</h3><p>{profile.city}</p></div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.formContainer}>
                <h2 className={styles.formHeader}>{t('portfolio.contactFormHeading')}</h2>
                <form onSubmit={handleSubmit} className={styles.contactForm}>
                    <div className={styles.formGroup}>
                        <label>{t('portfolio.yourName')}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder={t('portfolio.placeholderFullName')} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('portfolio.yourEmail')}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder={t('portfolio.placeholderEmail')} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('portfolio.subject')}</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder={t('portfolio.placeholderSubject')} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('portfolio.message')}</label>
                        <textarea name="message" value={formData.message} onChange={handleChange} required placeholder={t('portfolio.messagePlaceholder')}></textarea>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <><Loader2 size={20} className={styles.spinner}/> {t('portfolio.sending')}</> : <><Send size={20} /> {t('portfolio.sendMessage')}</>}
                    </button>

                    {status.message && (
                        <div className={status.type === 'success' ? styles.successMessage : styles.errorMessage}>
                            {status.message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
