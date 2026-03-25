"use client";

import React, { useState } from 'react';
import { Send, MapPin, Mail, Loader2 } from 'lucide-react';
import api from '@/lib/api/client';
import t1Styles from '../styles/template1.module.scss';
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
            setErrorMessage(error.response?.data?.detail || 'Failed to send message. Please try again.');
        }
    };

    return (
        <div className={t1Styles.pageContainer}>
            <div className={styles.contactLayout}>
                {/* Left Side: Info */}
                <div className={styles.contactInfo}>
                    <h1 className={styles.pageTitle}>Let's talk</h1>
                    <p className={styles.subtitle}>
                        Interested in working together or just want to say hi? 
                        Fill out the form and I'll get back to you as soon as possible.
                    </p>

                    <div className={styles.infoCards}>
                        {user.email && (
                            <div className={styles.infoCard}>
                                <div className={styles.iconBox}><Mail size={24} /></div>
                                <div>
                                    <h3>Email</h3>
                                    <p>{user.email}</p>
                                </div>
                            </div>
                        )}
                        {user.city && (
                            <div className={styles.infoCard}>
                                <div className={styles.iconBox}><MapPin size={24} /></div>
                                <div>
                                    <h3>Location</h3>
                                    <p>{user.city}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className={styles.formContainer}>
                    <form onSubmit={handleSubmit} className={styles.contactForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="name">Full Name</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                placeholder="John Doe"
                                disabled={status === 'loading'}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email Address</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                                placeholder="john@example.com"
                                disabled={status === 'loading'}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="subject">Subject</label>
                            <input 
                                type="text" 
                                id="subject" 
                                name="subject" 
                                value={formData.subject} 
                                onChange={handleChange} 
                                required 
                                placeholder="Project inquiry"
                                disabled={status === 'loading'}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="message">Message</label>
                            <textarea 
                                id="message" 
                                name="message" 
                                value={formData.message} 
                                onChange={handleChange} 
                                required 
                                rows={6}
                                placeholder="Tell me about your project..."
                                disabled={status === 'loading'}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={styles.submitBtn} 
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? (
                                <><Loader2 size={18} className={styles.spinner} /> Sending...</>
                            ) : (
                                <><Send size={18} /> Send Message</>
                            )}
                        </button>

                        {status === 'success' && (
                            <div className={styles.successMessage}>
                                Your message has been sent successfully!
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
