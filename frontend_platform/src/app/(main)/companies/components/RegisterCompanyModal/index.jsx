"use client";
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './styles.module.scss';
import { business, content } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterCompanyModal({ isOpen, onClose, onSuccess }) {
    const router = useRouter();
    const [step, setStep] = useState('loading'); // loading, check_failed, form
    const [articleCount, setArticleCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        summary: '',
        phone: '',
        email: '',
        address: '',
        website_url: '',
        founded_at: '',
        company_size: '1-10'
    });
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        if (isOpen) {
            checkRequirements();
        }
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
            console.error("Failed to check stats", error);
            // Fallback: assume failed or show error? Let's show failed state with 0 count or error message.
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });
        if (logo) data.append('logo', logo);

        try {
            await business.createCompany(data);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create company", error);
            // Add toast here potentially
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Register Company</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>

                {step === 'loading' && (
                    <div className={styles.loadingContainer}>
                        Checking eligibility...
                    </div>
                )}

                {step === 'check_failed' && (
                    <div className={styles.warningContent}>
                        <div className={styles.warningIcon}>
                            <AlertCircle size={48} color="#e67e22" />
                        </div>
                        <h3>Eligibility Check Failed</h3>
                        <p>
                            To verify your expertise and ensure quality, you must publish at least <strong>3 articles</strong> before creating a company page.
                        </p>

                        <div className={styles.progress}>
                            <span>Your Progress:</span>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${(articleCount / 3) * 100}%` }}></div>
                            </div>
                            <span className={styles.count}>{articleCount}/3 Articles</span>
                        </div>

                        <div className={styles.actions}>
                            <Button variant="outline" onClick={onClose}>Close</Button>
                            <Button onClick={() => router.push('/content/create')}>Write Article</Button>
                        </div>
                    </div>
                )}

                {step === 'form' && (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.eligibilityBanner}>
                            <CheckCircle size={16} />
                            <span>You are eligible to create a company page ({articleCount}/3 articles).</span>
                        </div>

                        <div className={styles.field}>
                            <label>Company Name *</label>
                            <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Acme Corp" />
                        </div>

                        <div className={styles.field}>
                            <label>Summary *</label>
                            <textarea name="summary" rows={3} value={formData.summary} onChange={handleChange} required placeholder="Short description..." />
                        </div>

                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label>Founded Date *</label>
                                <input type="date" name="founded_at" value={formData.founded_at} onChange={handleChange} required />
                            </div>
                            <div className={styles.field}>
                                <label>Company Size *</label>
                                <select name="company_size" value={formData.company_size} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' }}>
                                    <option value="1-10">1-10 Employees</option>
                                    <option value="11-50">11-50 Employees</option>
                                    <option value="51-200">51-200 Employees</option>
                                    <option value="201-500">201-500 Employees</option>
                                    <option value="501-1000">501-1000 Employees</option>
                                    <option value="1000+">1000+ Employees</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label>Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="contact@company.com" />
                            </div>
                            <div className={styles.field}>
                                <label>Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+123..." />
                            </div>
                        </div>

                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label>Address</label>
                                <input name="address" value={formData.address} onChange={handleChange} placeholder="City, Country" />
                            </div>
                            <div className={styles.field}>
                                <label>Website</label>
                                <input name="website_url" value={formData.website_url} onChange={handleChange} placeholder="https://..." />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>Logo *</label>
                            <div className={styles.imageUpload}>
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className={styles.preview} />
                                ) : (
                                    <div className={styles.placeholderLogo}>No Logo</div>
                                )}
                                <label className={styles.uploadBtn}>
                                    <Upload size={18} /> Upload Logo
                                    <input type="file" onChange={handleFileChange} accept="image/*" hidden required />
                                </label>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button htmlType="submit" type="primary" disabled={loading}>{loading ? 'Creating...' : 'Register Company'}</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
