"use client";

import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import api from '@/lib/api/client';
import styles from '../styles/contact.module.scss';

export default function Contact({ user }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const profile = user?.user || {};
    const username = profile.username;

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username) return;
        
        setStatus('loading');
        setErrorMessage('');

        try {
            await api.post(`/websites/${username}/contact/`, formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.response?.data?.detail || 'Xəta baş verdi. Yenidən cəhd edin.');
        }
    };

    if (!isMounted) return null;

    return (
        <div className={styles.contactWrapper}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <h1>{t('portfolio.getInTouch')}</h1>
                    <p>{t('portfolio.getInTouchDesc')}</p>
                </div>

                <div className={styles.contactGrid}>
                    <div className={styles.contactCards}>
                        {profile.email && (
                            <div className={styles.card}>
                                <div className={styles.iconWrapper}><Mail size={32} /></div>
                                <div className={styles.cardBody}>
                                    <h4>{t('portfolio.emailUs')}</h4>
                                    <p><a href={`mailto:${profile.email}`}>{profile.email}</a></p>
                                </div>
                            </div>
                        )}
                        {profile.phone_number && (
                            <div className={styles.card}>
                                <div className={styles.iconWrapper}><Phone size={32} /></div>
                                <div className={styles.cardBody}>
                                    <h4>{t('portfolio.emergencyHelp')}</h4>
                                    <p><a href={`tel:${profile.phone_number}`}>{profile.phone_number}</a></p>
                                </div>
                            </div>
                        )}
                         {profile.city && (
                            <div className={styles.card}>
                                <div className={styles.iconWrapper}><MapPin size={32} /></div>
                                <div className={styles.cardBody}>
                                    <h4>{t('portfolio.location')}</h4>
                                    <p>{profile.city}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.formBox}>
                        <h3>{t('portfolio.sendMessage')}</h3>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">{t('portfolio.fullName')}</label>
                                    <input 
                                        type="text" 
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('portfolio.fullName')} 
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="email">{t('portfolio.emailAddress')}</label>
                                    <input 
                                        type="email" 
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('portfolio.emailAddress')} 
                                        disabled={status === 'loading'}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="subject">{t('portfolio.subject')}</label>
                                <input 
                                    type="text" 
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('portfolio.subject')} 
                                    disabled={status === 'loading'}
                                />
                            </div>
                            <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                                <label htmlFor="message">{t('portfolio.messagePlaceholder')}</label>
                                <textarea 
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('portfolio.messagePlaceholder')} 
                                    disabled={status === 'loading'}
                                />
                            </div>
                            <button type="submit" className={styles.btnSubmit} style={{ marginTop: '32px' }} disabled={status === 'loading'}>
                                {status === 'loading' ? (
                                    <Loader2 size={20} className={styles.spinner} />
                                ) : (
                                    <Send size={20} />
                                )}
                                {status === 'loading' ? t('portfolio.sending') : t('portfolio.sendMessage')}
                            </button>

                            {status === 'success' && (
                                <div className={styles.successMessage} style={{ marginTop: '20px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                    <CheckCircle size={20} /> {t('portfolio.msgSuccess')}
                                </div>
                            )}

                            {status === 'error' && (
                                <div className={styles.errorMessage} style={{ marginTop: '20px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                    <AlertCircle size={20} /> {errorMessage}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
