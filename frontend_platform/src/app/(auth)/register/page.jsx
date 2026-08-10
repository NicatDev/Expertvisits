"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import api from '@/lib/api/client'; // Direct client for categories
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSelect from '@/components/ui/LocationSelect';
import SearchableSelect from '@/components/ui/SearchableSelect';
import styles from '../style.module.scss';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import GoogleAuthButton from '@/components/ui/GoogleAuthButton';
import { useAuth } from '@/lib/contexts/AuthContext';

const COMMON_PASSWORDS = new Set([
    'password', 'password123', '12345678', '123456789', '1234567890',
    'qwerty123', 'qwertyuiop', 'admin123', 'adminadmin', 'letmein123'
]);

const AVAILABILITY_DELAY = 500;

export default function RegisterPage() {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language || 'az';
    const langKey = `name_${currentLang}`;
    const profKey = `profession_${currentLang}`;
    
    const router = useRouter();
    const { login } = useAuth();
    const [step, setStep] = useState(1); // 1: Registration, 3: Verification
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [professionId, setProfessionId] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [verificationCode, setVerificationCode] = useState('');
    const [availability, setAvailability] = useState({
        username: { status: 'idle', message: '' },
        email: { status: 'idle', message: '' }
    });

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        birth_day: '',
        city: '',
        language: currentLang
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const translateError = React.useCallback((field, message, fallbackKey = 'registration_failed') => {
        const text = Array.isArray(message) ? message[0] : message;
        const raw = String(text || '').toLowerCase();
        const label = t(`auth_page.${field}`) || t(`auth_page.errors.${field}`) || field;

        if (!text) return t(`auth_page.errors.${fallbackKey}`);
        if (raw.includes('already taken') || raw.includes('already registered') || raw.includes('already exists') || raw.includes('unique')) {
            return field === 'email' ? t('auth_page.validation.email_taken') : t('auth_page.validation.username_taken');
        }
        if (raw.includes('required') || raw.includes('blank') || raw.includes('null')) {
            return t('auth_page.validation.field_required', { field: label });
        }
        if (raw.includes('valid email')) return t('auth_page.errors.invalid_email');
        if (raw.includes('invalid code')) return t('auth_page.validation.invalid_code');
        if (raw.includes('invalid verification session')) return t('auth_page.validation.invalid_session');
        if (raw.includes('failed to send email')) return t('auth_page.validation.email_send_failed');
        if (raw.includes('username taken during verification')) return t('auth_page.validation.username_taken');
        if (raw.includes('no more than')) {
            const count = raw.match(/no more than (\d+)/)?.[1];
            return t('auth_page.validation.max_length', { field: label, count: count || '' });
        }
        return t(`auth_page.errors.${fallbackKey}`);
    }, [t]);

    const passwordChecks = React.useMemo(() => {
        const password = formData.password || '';
        const lowered = password.toLowerCase();
        const profileParts = [
            formData.username,
            formData.email?.split('@')?.[0],
            formData.first_name,
            formData.last_name
        ].filter(Boolean).map(v => String(v).toLowerCase().trim()).filter(v => v.length >= 3);
        const similarPart = profileParts.find(part => lowered.includes(part) || part.includes(lowered));

        return [
            { key: 'min_length', valid: password.length >= 8 },
            { key: 'not_numeric', valid: password.length > 0 && !/^\d+$/.test(password) },
            { key: 'not_common', valid: password.length > 0 && !COMMON_PASSWORDS.has(lowered) },
            { key: 'not_similar', valid: password.length > 0 && !similarPart }
        ];
    }, [formData.password, formData.username, formData.email, formData.first_name, formData.last_name]);

    const passwordsMatch = Boolean(formData.password && formData.confirmPassword && formData.password === formData.confirmPassword);
    const isPasswordValid = passwordChecks.every(item => item.valid) && passwordsMatch;

    useEffect(() => {
        const username = formData.username.trim();
        const email = formData.email.trim();

        setAvailability(prev => ({
            username: username ? prev.username : { status: 'idle', message: '' },
            email: email ? prev.email : { status: 'idle', message: '' }
        }));

        if (!username && !email) return;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setAvailability(prev => ({
                ...prev,
                email: { status: 'invalid', message: t('auth_page.errors.invalid_email') }
            }));
        }

        const timer = setTimeout(async () => {
            const payload = {};
            if (username) payload.username = username;
            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) payload.email = email;
            if (!payload.username && !payload.email) return;

            setAvailability(prev => ({
                username: payload.username ? { status: 'checking', message: t('auth_page.validation.checking') } : prev.username,
                email: payload.email ? { status: 'checking', message: t('auth_page.validation.checking') } : prev.email
            }));

            try {
                await auth.checkAvailability(payload);
                setAvailability(prev => ({
                    username: payload.username ? { status: 'valid', message: t('auth_page.validation.username_available') } : prev.username,
                    email: payload.email ? { status: 'valid', message: t('auth_page.validation.email_available') } : prev.email
                }));
            } catch (err) {
                const data = err.response?.data || {};
                setAvailability(prev => ({
                    username: payload.username
                        ? data.username
                            ? { status: 'invalid', message: translateError('username', data.username) }
                            : { status: 'valid', message: t('auth_page.validation.username_available') }
                        : prev.username,
                    email: payload.email
                        ? data.email
                            ? { status: 'invalid', message: translateError('email', data.email) }
                            : { status: 'valid', message: t('auth_page.validation.email_available') }
                        : prev.email
                }));
            }
        }, AVAILABILITY_DELAY);

        return () => clearTimeout(timer);
    }, [formData.username, formData.email, t, translateError]);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/accounts/categories/');
            setCategories(data.results || data);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const formatError = (errData) => {
        if (!errData) return '';
        if (typeof errData === 'string') return translateError('general', errData);
        if (typeof errData === 'object') {
            const firstKey = Object.keys(errData)[0];
            const detail = errData[firstKey];
            return translateError(firstKey, detail);
        }
        return t('auth_page.errors.registration_failed');
    };

    const validateForm = () => {
        setFieldErrors({});
        const errors = {};

        if (!formData.first_name) errors.first_name = t('auth_page.validation.field_required', { field: t('auth_page.first_name') });
        if (!formData.last_name) errors.last_name = t('auth_page.validation.field_required', { field: t('auth_page.last_name') });
        if (!formData.username) errors.username = t('auth_page.validation.field_required', { field: t('auth_page.username') });
        if (!formData.email) errors.email = t('auth_page.validation.field_required', { field: t('auth_page.email') });
        if (!formData.password) errors.password = t('auth_page.validation.field_required', { field: t('auth_page.password') });
        if (!professionId) errors.professionId = t('auth_page.validation.field_required', { field: t('auth_page.profession') });
        if (!formData.city) errors.city = t('auth_page.validation.field_required', { field: t('auth_page.city') });

        if (Object.keys(errors).length > 0) {
            setError(t('auth_page.errors.fill_all'));
            setFieldErrors(errors);
            return false;
        }

        if (!isPasswordValid) {
            const msg = t('auth_page.validation.password_incomplete');
            setError(msg);
            setFieldErrors({ password: msg });
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            const msg = t('auth_page.errors.invalid_email');
            setError(msg);
            setFieldErrors({ email: msg });
            return false;
        }
        if (availability.username.status === 'invalid' || availability.email.status === 'invalid') {
            const msg = availability.username.status === 'invalid' ? availability.username.message : availability.email.message;
            setError(msg);
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Check availability first
            await auth.checkAvailability({
                username: formData.username,
                email: formData.email
            });

            // Proceed to register
            await auth.register({
                ...formData,
                interests: [], 
                profession_sub_category_id: professionId
            });

            setStep(3);
        } catch (err) {
            console.error("Registration error:", err);
            if (err.response?.data) {
                const data = err.response.data;
                setError(formatError(data));
                
                const newFieldErrors = {};
                Object.keys(data).forEach(key => {
                    const msg = translateError(key, data[key]);
                    newFieldErrors[key] = msg;
                });
                setFieldErrors(newFieldErrors);
            } else {
                setError(t('auth_page.errors.registration_failed') || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        if (!verificationCode) return;
        setLoading(true);
        setError('');
        try {
            await auth.verifyEmail({
                email: formData.email,
                code: verificationCode
            });
            try {
                await login(formData.username, formData.password);
                router.push('/');
            } catch (loginErr) {
                console.error("Auto login after registration failed:", loginErr);
                setError(t('auth_page.errors.auto_login_failed'));
            }
        } catch (err) {
            if (err.response?.data?.error) {
                setError(translateError('code', err.response.data.error, 'verification_failed'));
            } else {
                setError(t('auth_page.errors.verification_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        try {
            await auth.resendCode({ email: formData.email });
            alert(t('auth_page.alerts.code_resent') || 'Verification code resent!');
        } catch (err) {
            setError(translateError('email', err.response?.data?.error, 'failed_resend'));
        }
    };

    const ValidationHint = ({ state }) => {
        if (!state?.message) return null;
        return <div className={`${styles.validationHint} ${styles[state.status]}`}>{state.message}</div>;
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.title}>
                    {step === 1 ? t('auth_page.join_title') : t('auth_page.verify_title')}
                </h1>

                {step === 1 && (
                    <>
                        <GoogleAuthButton mode="signup" />

                        <div style={{ margin: '32px 0 24px', textAlign: 'center', position: 'relative' }}>
                            <span style={{ padding: '0 12px', position: 'relative', zIndex: 1, color: '#999', fontSize: '13px', backgroundColor: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {t('auth_page.or') || 'OR'}
                            </span>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#f0f0f0', zIndex: 0 }}></div>
                        </div>

                        <form onSubmit={handleRegister} className={styles.form}>
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('auth_page.personal_info')}</h3>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <Input 
                                            label={t('auth_page.first_name')} 
                                            name="first_name" 
                                            placeholder="John" 
                                            value={formData.first_name} 
                                            onChange={handleChange} 
                                            required 
                                            error={fieldErrors.first_name} 
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <Input 
                                            label={t('auth_page.last_name')} 
                                            name="last_name" 
                                            placeholder="Doe" 
                                            value={formData.last_name} 
                                            onChange={handleChange} 
                                            required 
                                            error={fieldErrors.last_name} 
                                        />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <Input 
                                        label={t('auth_page.username')} 
                                        name="username" 
                                        placeholder="johndoe" 
                                        value={formData.username} 
                                        onChange={handleChange} 
                                        required 
                                        error={fieldErrors.username} 
                                    />
                                    <ValidationHint state={availability.username} />
                                </div>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <Input 
                                            label={t('auth_page.phone')} 
                                            name="phone_number" 
                                            placeholder="+994 50 123 45 67" 
                                            value={formData.phone_number} 
                                            onChange={handleChange} 
                                            error={fieldErrors.phone_number} 
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <Input 
                                            label={t('auth_page.birth_day')} 
                                            name="birth_day" 
                                            type="date" 
                                            value={formData.birth_day} 
                                            onChange={handleChange} 
                                            error={fieldErrors.birth_day} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('auth_page.professional_details')}</h3>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <label>{t('auth_page.city')}</label>
                                        <LocationSelect
                                            value={formData.city}
                                            onChange={val => {
                                                setFormData(prev => ({ ...prev, city: val }));
                                                if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: '' }));
                                            }}
                                            placeholder={t('auth_page.select_city')}
                                        />
                                        {fieldErrors.city && <div style={{ color: '#ff4d4f', fontSize: '13px', marginTop: '4px' }}>{fieldErrors.city}</div>}
                                    </div>
                                    <div className={styles.field}>
                                        <label>{t('auth_page.profession')}</label>
                                        <SearchableSelect
                                            options={categories}
                                            value={professionId}
                                            onChange={(val) => {
                                                setProfessionId(val);
                                                if (fieldErrors.professionId) setFieldErrors(prev => ({ ...prev, professionId: '' }));
                                            }}
                                            groupBy="subcategories"
                                            labelKey={langKey}
                                            professionKey={profKey}
                                            valueKey="id"
                                            placeholder={t('auth_page.select_profession')}
                                        />
                                        {fieldErrors.professionId && <div style={{ color: '#ff4d4f', fontSize: '13px', marginTop: '4px' }}>{fieldErrors.professionId}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('auth_page.security')}</h3>
                                <div className={styles.field}>
                                    <Input 
                                        label={t('auth_page.email')} 
                                        name="email" 
                                        type="email" 
                                        placeholder="example@mail.com" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        required 
                                        error={fieldErrors.email} 
                                    />
                                    <ValidationHint state={availability.email} />
                                </div>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <Input 
                                            label={t('auth_page.password')} 
                                            name="password" 
                                            type="password" 
                                            placeholder="********" 
                                            value={formData.password} 
                                            onChange={handleChange} 
                                            required 
                                            error={fieldErrors.password} 
                                        />
                                        {formData.password && (
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
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                            required 
                                            error={fieldErrors.confirmPassword} 
                                        />
                                        {formData.confirmPassword && (
                                            <div className={`${styles.validationHint} ${passwordsMatch ? styles.valid : styles.invalid}`}>
                                                {passwordsMatch ? t('auth_page.password_rules.passwords_match') : t('auth_page.errors.passwords_mismatch')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && (
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
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '48px', fontSize: '16px', fontWeight: '600' }}>
                                {loading ? t('auth_page.registering') : t('auth_page.register_btn')}
                            </Button>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <form onSubmit={handleVerifyEmail} className={styles.form}>
                        <p style={{ marginBottom: '24px', color: '#666', textAlign: 'center', fontSize: '15px' }}>
                            {t('auth_page.code_sent_desc')}
                        </p>
                        <Input
                            name="code"
                            placeholder={t('auth_page.enter_code')}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            maxLength={6}
                            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: '700', height: '60px' }}
                            error={error}
                        />
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                            <Button type="default" onClick={handleResendCode} block style={{ height: '48px' }}>
                                {t('auth_page.resend_code')}
                            </Button>
                            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: '48px' }}>
                                {t('auth_page.verify_btn')}
                            </Button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <div className={styles.footer}>
                        {t('auth_page.have_account')} <Link href="/login">{t('auth_page.login_link')}</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
