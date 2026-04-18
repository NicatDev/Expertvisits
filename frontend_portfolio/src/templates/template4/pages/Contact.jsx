"use client";

import React, { useState, useEffect } from 'react';
import { Send, MapPin, Mail, Phone, Loader2 } from 'lucide-react';
import api from '@/lib/api/client';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/contact.module.scss';

export default function Contact({ user }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            await api.post(`/websites/${user.username}/contact/`, formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            
            // Reset success message after 5 seconds
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.response?.data?.detail || t('portfolio.contactFormError'));
        }
    };

    const profile = user.user || {};
    const phone_number = profile.phone_number || null;

    if (!isMounted) return null;

    return (
        <div style={{ width: '100%', paddingBottom: '80px' }}>
            <div className={styles.contactLayout}>
                {/* Left Side: Info */}
                <div className={styles.contactInfo}>
                    <h1 className={styles.pageTitle}>{t('portfolio.letsTalk')} <span>{t('portfolio.together')}</span></h1>
                    <p className={styles.subtitle}>
                        {t('portfolio.contactPageIntro')}
                    </p>

                    <div className={styles.infoCards}>
                        {profile.email && (
                            <div className={styles.infoCard}>
                                <div className={styles.iconBox}><Mail size={24} /></div>
                                <div>
                                    <h3>{t('portfolio.email')}</h3>
                                    <p>{profile.email}</p>
                                </div>
                            </div>
                        )}
                        {phone_number && (
                            <div className={styles.infoCard}>
                                <div className={styles.iconBox}><Phone size={24} /></div>
                                <div>
                                    <h3>{t('portfolio.phone')}</h3>
                                    <p>{phone_number}</p>
                                </div>
                            </div>
                        )}
                        {profile.city && (
                            <div className={styles.infoCard}>
                                <div className={styles.iconBox}><MapPin size={24} /></div>
                                <div>
                                    <h3>{t('portfolio.location')}</h3>
                                    <p>{profile.city}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className={styles.formContainer}>
                    <h2 className={styles.formHeader}>{t('portfolio.contactFormHeading')}</h2>
                    <form onSubmit={handleSubmit} className={styles.contactForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="name">{t('portfolio.fullName')}</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                placeholder={t('portfolio.placeholderFullName')}
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
                                placeholder={t('portfolio.placeholderEmail')}
                                disabled={status === 'loading'}
                            />
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

                        <div className={styles.formGroup}>
                            <label htmlFor="message">{t('portfolio.message')}</label>
                            <textarea 
                                id="message" 
                                name="message" 
                                value={formData.message} 
                                onChange={handleChange} 
                                required 
                                rows={5}
                                placeholder={t('portfolio.messagePlaceholder')}
                                disabled={status === 'loading'}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={styles.submitBtn} 
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? (
                                <><Loader2 size={18} className={styles.spinner} /> {t('portfolio.sending')}</>
                            ) : (
                                <><Send size={18} /> {t('portfolio.sendMessage')}</>
                            )}
                        </button>

                        {status === 'success' && (
                            <div className={styles.successMessage}>
                                {t('portfolio.msgSuccess')}
                            </div>
                        )}

                        {status === 'error' && (
                            <div className={styles.errorMessage}>
                                {errorMessage}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
