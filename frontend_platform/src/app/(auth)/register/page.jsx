
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import api from '@/lib/api/client'; // Direct client for categories
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSelect from '@/components/ui/LocationSelect';
import styles from '../auth.module.scss';
import { ChevronRight, Check } from 'lucide-react';

export default function RegisterPage() {
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
        if (step === 2) {
            fetchCategories();
        }
    }, [step]);

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
            setError("Passwords don't match");
            return;
        }
        if (!formData.first_name || !formData.last_name || !formData.username || !formData.email || !formData.password) {
            setError("Please fill in all required fields");
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
                else setError('Username or email already taken');
            } else {
                setError('Failed to validate information');
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
            setError("Please select at least one interest");
            return;
        }
        setLoading(true);
        setError('');

        try {
            await auth.register({
                ...formData,
                interests: selectedInterests,
                profession_sub_category: professionId
            });
            // On success, move to step 3
            setStep(3);
        } catch (err) {
            if (err.response?.data) {
                // Handle DRF errors which might be object or array
                const msg = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
                setError(msg);
            } else {
                setError('Registration failed');
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
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        try {
            await auth.resendCode({ email: formData.email });
            alert('Code resent successfully!'); // Simple alert for now
        } catch (err) {
            console.error(err);
            setError('Failed to resend code');
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard} style={{ maxWidth: step === 2 ? '800px' : '480px' }}>
                <h1 className={styles.title}>
                    {step === 1 ? 'Join Octopus' : step === 2 ? 'Select Your Interests' : 'Verify Email'}
                </h1>

                {step === 1 && (
                    <form onSubmit={handleNext} className={styles.form}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Input name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required />
                            <Input name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required />
                        </div>
                        <Input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                        <Input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                        <Input name="phone_number" placeholder="Phone Number (Optional)" value={formData.phone_number} onChange={handleChange} />
                        <Input name="birth_day" type="date" placeholder="Birth Date" value={formData.birth_day} onChange={handleChange} />
                        <div style={{ marginBottom: '16px' }}>
                            <LocationSelect
                                value={formData.city}
                                onChange={val => setFormData(prev => ({ ...prev, city: val }))}
                                placeholder="City (Optional)"
                            />
                        </div>
                        <Input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        <Input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required error={error} />

                        <Button type="primary" htmlType="submit" block>
                            Next <ChevronRight size={16} />
                        </Button>
                    </form>
                )}

                {step === 2 && (
                    <div className={styles.interestsStep}>
                        <p style={{ marginBottom: '24px', color: '#666', textAlign: 'center' }}>
                            Select at least 1 topic to personalize your feed.
                        </p>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Primary Profession</label>
                            <select
                                value={professionId}
                                onChange={(e) => setProfessionId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select your profession...</option>
                                {categories.map(cat => (
                                    <optgroup key={cat.id} label={cat.name}>
                                        {cat.subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.profession || sub.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                This will be displayed on your profile (e.g. "Biznes Meneceri")
                            </p>
                        </div>

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
                            <Button type="default" onClick={() => setStep(1)} block>Back</Button>
                            <Button type="primary" onClick={handleRegister} block loading={loading}>
                                Register & Send Code
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleVerifyParams} className={styles.form}>
                        <p style={{ marginBottom: '24px', color: '#666', textAlign: 'center' }}>
                            We sent a 6-digit code to <strong>{formData.email}</strong>.<br />
                            Please enter it below to verify your account.
                        </p>
                        <Input
                            name="code"
                            placeholder="6-Digit Code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            maxLength={6}
                            style={{ textAlign: 'center', letteSpacing: '4px', fontSize: '18px' }}
                            error={error}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button type="default" onClick={handleResendCode} block>
                                Resend Code
                            </Button>
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                Verify Account
                            </Button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <div className={styles.footer}>
                        Already have an account? <Link href="/login">Login</Link>
                    </div>
                )}
            </div>
        </div >
    );
}
