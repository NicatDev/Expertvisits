"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext'; // Import useAuth
import { auth } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../auth.module.scss';
import { useTranslation } from '@/i18n/client';

export default function LoginPage() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { login } = useAuth(); // Destructure login
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use context login instead of direct api call
            await login(formData.username, formData.password);
            router.push('/');
        } catch (err) {
            setError(t('auth_page.errors.invalid_credentials'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.title}>{t('auth_page.welcome_back')}</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        name="username"
                        placeholder={t('auth_page.username')}
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        name="password"
                        type="password"
                        placeholder={t('auth_page.password')}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        error={error}
                    />
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        {loading ? t('auth_page.logging_in') : t('auth_page.login_btn')}
                    </Button>
                </form>
                <div className={styles.footer}>
                    {t('auth_page.no_account')} <Link href="/register">{t('auth_page.register_link')}</Link>
                </div>
            </div>
        </div>
    );
}
