"use client";
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { auth } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../style.module.scss';
import { useTranslation } from '@/i18n/client';

const COMMON_PASSWORDS = new Set([
    'password', 'password123', '12345678', '123456789', '1234567890',
    'qwerty123', 'qwertyuiop', 'admin123', 'adminadmin', 'letmein123'
]);

export default function ForgotPasswordPage() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const [step, setStep] = useState('email');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const passwordChecks = useMemo(() => {
        const lowered = password.toLowerCase();
        const emailName = email.split('@')[0]?.toLowerCase().trim();
        const similar = emailName && emailName.length >= 3 && lowered.includes(emailName);

        return [
            { key: 'min_length', valid: password.length >= 8 },
            { key: 'not_numeric', valid: password.length > 0 && !/^\d+$/.test(password) },
            { key: 'not_common', valid: password.length > 0 && !COMMON_PASSWORDS.has(lowered) },
            { key: 'not_similar', valid: password.length > 0 && !similar }
        ];
    }, [password, email]);

    const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
    const isPasswordValid = passwordChecks.every(item => item.valid) && passwordsMatch;

    const resetErrorMessage = (detail, fallback = 'generic') => {
        if (Array.isArray(detail)) detail = detail[0];
        const key = `auth_page.password_reset.errors.${detail}`;
        const msg = t(key);
        if (msg !== key) return msg;

        const raw = String(detail || '').toLowerCase();
        if (raw.includes('too common')) return t('auth_page.password_reset.errors.password_too_common');
        if (raw.includes('entirely numeric')) return t('auth_page.password_reset.errors.password_entirely_numeric');
        if (raw.includes('too short') || raw.includes('at least')) return t('auth_page.password_reset.errors.password_too_short');
        if (raw.includes('too similar')) return t('auth_page.password_reset.errors.password_too_similar');
        return t(`auth_page.password_reset.errors.${fallback}`);
    };

    const handleRequestCode = async (e) => {
        e.preventDefault();
        const trimmed = email.trim();
        setError('');

        if (!trimmed) {
            setError(t('auth_page.password_reset.errors.email_required'));
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setError(t('auth_page.errors.invalid_email'));
            return;
        }

        setLoading(true);
        try {
            await auth.requestPasswordReset(trimmed);
            setEmail(trimmed);
            setStep('reset');
        } catch (err) {
            setError(resetErrorMessage(err.response?.data?.detail));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!code.trim()) {
            setError(t('auth_page.password_reset.errors.code_required'));
            return;
        }
        if (!isPasswordValid) {
            setError(t('auth_page.validation.password_incomplete'));
            return;
        }

        setLoading(true);
        try {
            await auth.confirmPasswordReset(email, code.trim(), password);
            router.push('/login?password_reset=true');
        } catch (err) {
            const data = err.response?.data || {};
            setError(resetErrorMessage(data.detail || data.password, 'reset_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.title}>{t('auth_page.password_reset.title')}</h1>

                {step === 'email' ? (
                    <form onSubmit={handleRequestCode} className={styles.form}>
                        <p className={styles.authHint}>{t('auth_page.password_reset.email_hint')}</p>
                        <Input
                            label={t('auth_page.email')}
                            name="email"
                            type="email"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {error && <ErrorBox message={error} />}
                        <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '48px', fontSize: '16px', fontWeight: '600' }}>
                            {loading ? t('auth_page.password_reset.sending') : t('auth_page.password_reset.send_code')}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className={styles.form}>
                        <p className={styles.authHint}>{t('auth_page.password_reset.code_hint', { email })}</p>
                        <Input
                            label={t('auth_page.password_reset.code_label')}
                            name="code"
                            inputMode="numeric"
                            placeholder={t('auth_page.enter_code')}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            maxLength={6}
                        />
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <Input
                                    label={t('auth_page.password')}
                                    name="password"
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {password && (
                                    <ul className={styles.passwordChecklist}>
                                        {passwordChecks.map(item => (
                                            <li key={item.key} className={item.valid ? styles.valid : styles.invalid}>
                                                {t(`auth_page.password_rules.${item.key}`)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className={styles.field}>
                                <Input
                                    label={t('auth_page.confirm_password')}
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="********"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                {confirmPassword && (
                                    <div className={`${styles.validationHint} ${passwordsMatch ? styles.valid : styles.invalid}`}>
                                        {passwordsMatch ? t('auth_page.password_rules.passwords_match') : t('auth_page.errors.passwords_mismatch')}
                                    </div>
                                )}
                            </div>
                        </div>
                        {error && <ErrorBox message={error} />}
                        <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '48px', fontSize: '16px', fontWeight: '600' }}>
                            {loading ? t('auth_page.password_reset.resetting') : t('auth_page.password_reset.reset_password')}
                        </Button>
                    </form>
                )}

                <div className={styles.footer}>
                    <Link href="/login">{t('auth_page.login_link')}</Link>
                </div>
            </div>
        </div>
    );
}

function ErrorBox({ message }) {
    return (
        <div style={{
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '8px',
            padding: '12px',
            color: '#ff4d4f',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '500'
        }}>
            <AlertCircle size={18} />
            <span>{message}</span>
        </div>
    );
}
