"use client";
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './style.module.scss';
import { business, content } from '@/lib/api';
import { useTranslation } from '@/i18n/client';
import { toast } from 'react-toastify';

export default function RegisterCompanyModal({ isOpen, onClose, onSuccess }) {
    const { t } = useTranslation('common');
    const [step, setStep] = useState('loading');
    const [articleCount, setArticleCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [pendingEmail, setPendingEmail] = useState('');
    const [verifyCode, setVerifyCode] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        summary: '',
        phone: '',
        email: '',
        address: '',
        website_url: '',
        founded_at: '',
        company_size: '1-10',
    });
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setStep('loading');
            setErrors({});
            setPendingEmail('');
            setVerifyCode('');
            return;
        }
        checkRequirements();
    }, [isOpen]);

    const checkRequirements = async () => {
        setStep('loading');
        try {
            const res = await content.getArticleStats();
            const count = res.data.count;
            setArticleCount(count);
            if (count >= 3) {
                setStep('form');
            } else {
                setStep('check_failed');
            }
        } catch (error) {
            console.error('Failed to check stats', error);
            setStep('check_failed');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSendVerification = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const data = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key]) data.append(key, formData[key]);
        });
        if (logo) data.append('logo', logo);

        try {
            const { data: res } = await business.startCompanyRegistration(data);
            setPendingEmail(res.email || formData.email);
            setVerifyCode('');
            setStep('verify_email');
            toast.success(t('companies.modal.verify.sent_toast'));
        } catch (error) {
            console.error('Failed to start company registration', error);
            if (error.response?.data) {
                setErrors(
                    typeof error.response.data === 'object' ? error.response.data : { detail: [error.response.data] }
                );
            }
            if (error.response?.status === 503) {
                toast.error(t('companies.modal.verify.email_send_failed'));
            } else {
                toast.error(t('companies.modal.form.errors.save_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteRegistration = async (e) => {
        e.preventDefault();
        const code = verifyCode.replace(/\s/g, '');
        if (code.length !== 6) {
            setErrors({ code: [t('companies.modal.verify.code_invalid')] });
            return;
        }
        setLoading(true);
        setErrors({});
        try {
            await business.completeCompanyRegistration({ code });
            toast.success(t('companies.modal.form.success.posted'));
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to complete registration', error);
            const d = error.response?.data;
            if (d?.code) {
                setErrors({ code: Array.isArray(d.code) ? d.code : [d.code] });
            } else if (d?.detail) {
                toast.error(typeof d.detail === 'string' ? d.detail : t('companies.modal.form.errors.save_failed'));
            } else {
                toast.error(t('companies.modal.form.errors.save_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const goBackToForm = () => {
        setStep('form');
        setVerifyCode('');
        setErrors({});
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('companies.modal.title')}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn} aria-label={t('common.cancel')}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {step === 'loading' && (
                        <div className={styles.loadingContainer}>{t('companies.modal.checking')}</div>
                    )}

                    {step === 'check_failed' && (
                        <div className={styles.warningContent}>
                            <div className={styles.warningIcon}>
                                <AlertCircle size={48} color="#e67e22" />
                            </div>
                            <h3>{t('companies.modal.eligibility_failed')}</h3>
                            <p>{t('companies.modal.eligibility_desc')}</p>

                            <div className={styles.progress}>
                                <span>{t('companies.modal.progress')}</span>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${(articleCount / 3) * 100}%` }}
                                    />
                                </div>
                                <span className={styles.count}>
                                    {t('companies.modal.articles_count', { current: articleCount, total: 3 })}
                                </span>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="outline" onClick={onClose}>
                                    {t('companies.modal.close')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'form' && (
                        <form onSubmit={handleSendVerification} className={styles.form}>
                            <div className={styles.eligibilityBanner}>
                                <CheckCircle size={16} />
                                <span>{t('companies.modal.eligible_msg', { count: articleCount, total: 3 })}</span>
                            </div>

                            <div className={styles.field}>
                                <label>{t('companies.modal.form.name')} *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Acme Corp"
                                    className={errors.name ? styles.error : ''}
                                />
                                {errors.name && <span className={styles.errorMessage}>{errors.name[0]}</span>}
                            </div>

                            <div className={styles.field}>
                                <label>{t('companies.modal.form.summary')} *</label>
                                <textarea
                                    name="summary"
                                    rows={3}
                                    value={formData.summary}
                                    onChange={handleChange}
                                    required
                                    placeholder="..."
                                    className={errors.summary ? styles.error : ''}
                                />
                                {errors.summary && <span className={styles.errorMessage}>{errors.summary[0]}</span>}
                            </div>

                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.founded')} *</label>
                                    <input
                                        type="date"
                                        name="founded_at"
                                        value={formData.founded_at}
                                        onChange={handleChange}
                                        required
                                        className={errors.founded_at ? styles.error : ''}
                                    />
                                    {errors.founded_at && (
                                        <span className={styles.errorMessage}>{errors.founded_at[0]}</span>
                                    )}
                                </div>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.size')} *</label>
                                    <select
                                        name="company_size"
                                        value={formData.company_size}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            backgroundColor: '#fff',
                                        }}
                                        className={errors.company_size ? styles.error : ''}
                                    >
                                        <option value="1-10">1-10 {t('companies.employees')}</option>
                                        <option value="11-50">11-50 {t('companies.employees')}</option>
                                        <option value="51-200">51-200 {t('companies.employees')}</option>
                                        <option value="201-500">201-500 {t('companies.employees')}</option>
                                        <option value="501-1000">501-1000 {t('companies.employees')}</option>
                                        <option value="1000+">1000+ {t('companies.employees')}</option>
                                    </select>
                                    {errors.company_size && (
                                        <span className={styles.errorMessage}>{errors.company_size[0]}</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.email')} *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="contact@company.com"
                                        className={errors.email ? styles.error : ''}
                                    />
                                    {errors.email && <span className={styles.errorMessage}>{errors.email[0]}</span>}
                                </div>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.phone')}</label>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+123..."
                                        className={errors.phone ? styles.error : ''}
                                    />
                                    {errors.phone && <span className={styles.errorMessage}>{errors.phone[0]}</span>}
                                </div>
                            </div>

                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.address')}</label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="City, Country"
                                        className={errors.address ? styles.error : ''}
                                    />
                                    {errors.address && <span className={styles.errorMessage}>{errors.address[0]}</span>}
                                </div>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.website')}</label>
                                    <input
                                        name="website_url"
                                        value={formData.website_url}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className={errors.website_url ? styles.error : ''}
                                    />
                                    {errors.website_url && (
                                        <span className={styles.errorMessage}>{errors.website_url[0]}</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>{t('companies.modal.form.logo')} *</label>
                                <div className={styles.imageUpload}>
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className={styles.preview} />
                                    ) : (
                                        <div className={styles.placeholderLogo}>{t('companies.modal.form.no_logo')}</div>
                                    )}
                                    <label className={`${styles.uploadBtn} ${errors.logo ? styles.error : ''}`}>
                                        <Upload size={18} /> {t('companies.modal.form.upload_logo')}
                                        <input type="file" onChange={handleFileChange} accept="image/*" hidden required />
                                    </label>
                                </div>
                                {errors.logo && <span className={styles.errorMessage}>{errors.logo[0]}</span>}
                            </div>

                            <div className={styles.actions}>
                                <Button type="button" variant="ghost" onClick={onClose}>
                                    {t('common.cancel')}
                                </Button>
                                <Button htmlType="submit" type="primary" disabled={loading}>
                                    {loading ? t('companies.modal.form.sending_code') : t('companies.modal.form.continue_verify')}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'verify_email' && (
                        <form onSubmit={handleCompleteRegistration} className={styles.verifyStep}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('companies.modal.verify.title')}</h3>
                            <p className={styles.verifyHint}>
                                {t('companies.modal.verify.description')}{' '}
                                <span className={styles.verifyEmailStrong}>{pendingEmail}</span>
                            </p>
                            <div className={styles.field}>
                                <label htmlFor="company-reg-code">{t('companies.modal.verify.code_label')}</label>
                                <input
                                    id="company-reg-code"
                                    className={`${styles.codeInput} ${errors.code ? styles.error : ''}`}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={8}
                                    value={verifyCode}
                                    onChange={(ev) => setVerifyCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                />
                                {errors.code && <span className={styles.errorMessage}>{errors.code[0]}</span>}
                            </div>
                            <div className={styles.actions}>
                                <Button type="button" variant="ghost" onClick={goBackToForm}>
                                    {t('companies.modal.verify.back')}
                                </Button>
                                <Button htmlType="submit" type="primary" disabled={loading}>
                                    {loading ? t('companies.modal.form.creating') : t('companies.modal.verify.finish')}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
