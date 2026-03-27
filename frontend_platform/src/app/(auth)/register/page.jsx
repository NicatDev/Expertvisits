
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
import styles from '../auth.module.scss';
import { ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import GoogleAuthButton from '@/components/ui/GoogleAuthButton';

export default function RegisterPage() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]); // Array of IDs
    const [professionId, setProfessionId] = useState(''); // Single ID for profession
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        birth_day: '',
        city: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/accounts/categories/');
            setCategories(data.results || data);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError(t('auth_page.errors.passwords_mismatch'));
            return;
        }
        if (!formData.first_name || !formData.last_name || !formData.username || !formData.email || !formData.password || !professionId) {
            setError(t('auth_page.errors.fill_all'));
            return;
        }

        // Check availability
        try {
            await auth.checkAvailability({
                username: formData.username,
                email: formData.email
            });
            setError('');
            setStep(2);
        } catch (err) {
            // Handle specific field errors
            if (err.response?.data) {
                const data = err.response.data;
                if (data.username) setError(data.username[0]);
                else if (data.email) setError(data.email[0]);
                else setError(t('auth_page.errors.taken'));
            } else {
                setError(t('auth_page.errors.validation_failed'));
            }
            return;
        }
    };

    const toggleInterest = (id) => {
        setSelectedInterests(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleRegister = async () => {
        if (selectedInterests.length === 0) {
            setError(t('auth_page.errors.select_interest'));
            return;
        }
        setLoading(true);
        setError('');

        try {
            await auth.register({
                ...formData,
                interests: selectedInterests,
                profession_sub_category_id: professionId
            });
            // On success, move to step 3
            setStep(3);
        } catch (err) {
            if (err.response?.data) {
                // Handle DRF errors which might be object or array
                const msg = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
                setError(msg);
            } else {
                setError(t('auth_page.errors.registration_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyParams = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await auth.verifyEmail({
                email: formData.email,
                code: verificationCode
            });
            router.push('/login?verified=true');
        } catch (err) {
            setError(err.response?.data?.error || t('auth_page.errors.verification_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        try {
            await auth.resendCode({ email: formData.email });
            alert(t('auth_page.alerts.code_resent')); // Simple alert for now
        } catch (err) {
            console.error(err);
            setError(t('auth_page.errors.failed_resend'));
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard} style={{ maxWidth: step === 2 ? '800px' : '480px' }}>
                <h1 className={styles.title}>
                    {step === 1 ? t('auth_page.join_title') : step === 2 ? t('auth_page.interests_title') : t('auth_page.verify_title')}
                </h1>

                {step === 1 && (
                    <>
                        <GoogleAuthButton mode="signup" />

                        <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative' }}>
                            <span style={{ padding: '0 10px', position: 'relative', zIndex: 1, color: '#999', fontSize: '14px', backgroundColor: '#fff' }}>
                                {t('auth_page.or') || 'OR'}
                            </span>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e5e7eb', zIndex: 0 }}></div>
                        </div>

                        <form onSubmit={handleNext} className={styles.form}>
                            {/* Personal Information */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('auth_page.personal_info')}</h3>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <Input label={t('auth_page.first_name')} name="first_name" placeholder="John" value={formData.first_name} onChange={handleChange} required wrapperStyle={{ marginBottom: 0 }} />
                                    </div>
                                    <div className={styles.field}>
                                        <Input label={t('auth_page.last_name')} name="last_name" placeholder="Doe" value={formData.last_name} onChange={handleChange} required wrapperStyle={{ marginBottom: 0 }} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <Input label={t('auth_page.username')} name="username" placeholder="johndoe" value={formData.username} onChange={handleChange} required wrapperStyle={{ marginBottom: 0 }} />
                                </div>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <Input label={t('auth_page.phone')} name="phone_number" placeholder="+994 50 123 45 67 (Optional)" value={formData.phone_number} onChange={handleChange} wrapperStyle={{ marginBottom: 0 }} />
                                    </div>
                                    <div className={styles.field}>
                                        <Input label={t('auth_page.birth_date')} name="birth_day" type="date" placeholder="DD.MM.YYYY" value={formData.birth_day} onChange={handleChange} wrapperStyle={{ marginBottom: 0 }} />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('auth_page.professional_details')}</h3>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <label>{t('auth_page.city')}</label>
                                        <LocationSelect
                                            value={formData.city}
                                            onChange={val => setFormData(prev => ({ ...prev, city: val }))}
                                            placeholder={t('auth_page.select_city')}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>{t('auth_page.profession')}</label>
                                        <SearchableSelect
                                            options={categories}
                                            value={professionId}
                                            onChange={(val) => setProfessionId(val)}
                                            groupBy="subcategories"
                                            labelKey="name"
                                            valueKey="id"
                                            placeholder={t('auth_page.select_profession')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Account Security */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('auth_page.security')}</h3>
                                <div className={styles.field}>
                                    <Input label={t('auth_page.email')} name="email" type="email" placeholder="example@mail.com" value={formData.email} onChange={handleChange} required wrapperStyle={{ marginBottom: 0 }} />
                                </div>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <Input label={t('auth_page.password')} name="password" type="password" placeholder="********" value={formData.password} onChange={handleChange} required wrapperStyle={{ marginBottom: 0 }} />
                                    </div>
                                    <div className={styles.field}>
                                        <Input label={t('auth_page.confirm_password')} name="confirmPassword" type="password" placeholder="********" value={formData.confirmPassword} onChange={handleChange} required wrapperStyle={{ marginBottom: 0 }} />
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
                                    gap: '8px',
                                    fontSize: '14px'
                                }}>
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button type="primary" htmlType="submit" block>
                                {t('auth_page.next')} <ChevronRight size={16} />
                            </Button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <div className={styles.interestsStep}>
                        <p style={{ marginBottom: '24px', color: '#666', textAlign: 'center' }}>
                            {t('auth_page.select_topics_desc')}
                        </p>



                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px' }}>
                            {categories.map(cat => (
                                <div key={cat.id} style={{ marginBottom: '24px' }}>
                                    <h4 style={{ marginBottom: '12px', color: '#333', fontSize: '15px' }}>{cat.name}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {cat.subcategories.map(sub => {
                                            const isSelected = selectedInterests.includes(sub.id);
                                            return (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => toggleInterest(sub.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '20px',
                                                        border: isSelected ? 'none' : '1px solid #ddd',
                                                        background: isSelected ? 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)' : '#fff',
                                                        color: isSelected ? '#fff' : '#666',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {sub.name}
                                                    {isSelected && <Check size={14} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '16px' }}>{error}</div>}

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Button type="default" onClick={() => setStep(1)} block>{t('auth_page.back')}</Button>
                            <Button type="primary" onClick={handleRegister} block loading={loading}>
                                {loading ? t('auth_page.registering') : t('auth_page.register_btn')}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleVerifyParams} className={styles.form}>
                        <p style={{ marginBottom: '24px', color: '#666', textAlign: 'center' }}>
                            {t('auth_page.code_sent_desc')}
                        </p>
                        <Input
                            name="code"
                            placeholder={t('auth_page.enter_code')}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            maxLength={6}
                            style={{ textAlign: 'center', letteSpacing: '4px', fontSize: '18px' }}
                            error={error}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button type="default" onClick={handleResendCode} block>
                                {t('auth_page.resend_code')}
                            </Button>
                            <Button type="primary" htmlType="submit" block loading={loading}>
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
        </div >
    );
}
