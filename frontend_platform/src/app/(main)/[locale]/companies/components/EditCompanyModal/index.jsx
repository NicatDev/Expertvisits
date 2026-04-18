"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import { X, Upload } from 'lucide-react';
import styles from './style.module.scss';
import { business } from '@/lib/api';
import { useTranslation } from '@/i18n/client';

export default function EditCompanyModal({ isOpen, onClose, company, onSuccess }) {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('general');
    const [logoPreview, setLogoPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // Track deleted states
    const [isLogoDeleted, setIsLogoDeleted] = useState(false);
    const [isCoverDeleted, setIsCoverDeleted] = useState(false);

    useEffect(() => {
        if (isOpen && company) {
            setFormData({
                name: company.name,
                slogan: company.slogan || '',
                summary: company.summary,
                phone: company.phone || '',
                email: company.email || '',
                founded_at: company.founded_at || '',
                company_size: company.company_size || '1-10',
                address: company.address || '',
                website_url: company.website_url || '',
                linkedin_url: company.linkedin_url || '',
                instagram_url: company.instagram_url || '',
                facebook_url: company.facebook_url || ''
            });

            // Initialize previews
            setLogoPreview(company.logo);
            setCoverPreview(company.cover_image);

            // Reset delete flags
            setIsLogoDeleted(false);
            setIsCoverDeleted(false);
            setActiveTab('general');
        }
    }, [isOpen, company]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, [field]: file });
            const previewUrl = URL.createObjectURL(file);

            if (field === 'logo') {
                setLogoPreview(previewUrl);
                setIsLogoDeleted(false);
            } else if (field === 'cover_image') {
                setCoverPreview(previewUrl);
                setIsCoverDeleted(false);
            }
        }
    };

    const handleDeleteImage = (field) => {
        if (field === 'logo') {
            setLogoPreview(null);
            setFormData(prev => ({ ...prev, logo: null }));
            setIsLogoDeleted(true);
        } else if (field === 'cover_image') {
            setCoverPreview(null);
            setFormData(prev => ({ ...prev, cover_image: null }));
            setIsCoverDeleted(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                if (key === 'logo' || key === 'cover_image') {
                    if (formData[key] instanceof File) {
                        data.append(key, formData[key]);
                    }
                } else {
                    data.append(key, formData[key]);
                }
            }
        });

        if (isLogoDeleted) data.append('delete_logo', 'true');
        if (isCoverDeleted) data.append('delete_cover_image', 'true');

        try {
            await business.updateCompany(company.slug, data);
            toast.success(t('companies.edit_modal.form.success'));
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update company", error);
            const msg = error.response?.data?.detail || t('companies.edit_modal.form.error');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: t('companies.edit_modal.tabs.general') },
        { id: 'contact', label: t('companies.edit_modal.tabs.contact') },
        { id: 'media', label: t('companies.edit_modal.tabs.media') },
        { id: 'social', label: t('companies.edit_modal.tabs.social') }
    ];

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('companies.edit_modal.title')}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>

                <div className={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {activeTab === 'general' && (
                        <>
                            <div className={styles.field}>
                                <label>{t('companies.modal.form.name')}</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} required />
                            </div>

                            <div className={styles.field}>
                                <label>{t('company_detail.info.slogan')}</label>
                                <input
                                    name="slogan"
                                    value={formData.slogan || ''}
                                    onChange={handleChange}
                                    maxLength={255}
                                    placeholder={t('companies.edit_modal.form.slogan_placeholder')}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>{t('companies.modal.form.summary')}</label>
                                <textarea name="summary" rows={4} value={formData.summary || ''} onChange={handleChange} required placeholder={t('companies.edit_modal.form.summary_placeholder')} />
                            </div>

                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.founded')}</label>
                                    <input type="date" name="founded_at" value={formData.founded_at || ''} onChange={handleChange} required />
                                </div>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.size')}</label>
                                    <select name="company_size" value={formData.company_size || '1-10'} onChange={handleChange} required>
                                        <option value="1-10">1-10 {t('companies.employees')}</option>
                                        <option value="11-50">11-50 {t('companies.employees')}</option>
                                        <option value="51-200">51-200 {t('companies.employees')}</option>
                                        <option value="201-500">201-500 {t('companies.employees')}</option>
                                        <option value="501-1000">501-1000 {t('companies.employees')}</option>
                                        <option value="1000+">1000+ {t('companies.employees')}</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'contact' && (
                        <>
                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.email')}</label>
                                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required />
                                </div>
                                <div className={styles.field}>
                                    <label>{t('companies.modal.form.phone')}</label>
                                    <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+994..." />
                                    <small style={{ color: '#999', fontSize: '11px' }}>{t('companies.edit_modal.form.phone_hint')}</small>
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label>{t('companies.modal.form.address')}</label>
                                <input name="address" value={formData.address || ''} onChange={handleChange} />
                            </div>
                        </>
                    )}

                    {activeTab === 'media' && (
                        <>
                            <div className={styles.field}>
                                <label>{t('companies.modal.form.logo')}</label>
                                <div className={styles.imageUpload}>
                                    {logoPreview && (
                                        <div className={styles.previewContainer}>
                                            <img src={logoPreview} alt="Logo" className={styles.preview} />
                                            <button type="button" onClick={() => handleDeleteImage('logo')} className={styles.deleteFileBtn}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <label className={styles.uploadBtn}>
                                        <Upload size={18} /> {logoPreview ? t('companies.edit_modal.form.change_logo') : t('companies.edit_modal.form.upload_logo')}
                                        <input type="file" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" hidden />
                                    </label>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>{t('company_detail.edit_cover')}</label>
                                <div className={styles.imageUpload}>
                                    {coverPreview && (
                                        <div className={styles.previewContainer}>
                                            <img src={coverPreview} alt="Cover" className={styles.preview} />
                                            <button type="button" onClick={() => handleDeleteImage('cover_image')} className={styles.deleteFileBtn}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <label className={styles.uploadBtn}>
                                        <Upload size={18} /> {coverPreview ? t('companies.edit_modal.form.change_cover') : t('companies.edit_modal.form.upload_cover')}
                                        <input type="file" onChange={(e) => handleFileChange(e, 'cover_image')} accept="image/*" hidden />
                                    </label>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'social' && (
                        <>
                            <div className={styles.field}>
                                <label>{t('companies.modal.form.website')}</label>
                                <input name="website_url" value={formData.website_url || ''} onChange={handleChange} placeholder="https://..." />
                            </div>
                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label>LinkedIn</label>
                                    <input name="linkedin_url" value={formData.linkedin_url || ''} onChange={handleChange} placeholder="https://linkedin.com/company/..." />
                                </div>
                                <div className={styles.field}>
                                    <label>Instagram</label>
                                    <input name="instagram_url" value={formData.instagram_url || ''} onChange={handleChange} placeholder="https://instagram.com/..." />
                                </div>
                                <div className={styles.field}>
                                    <label>Facebook</label>
                                    <input name="facebook_url" value={formData.facebook_url || ''} onChange={handleChange} placeholder="https://facebook.com/..." />
                                </div>
                            </div>
                        </>
                    )}

                    <div className={styles.actions}>
                        <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button htmlType="submit" type="primary" disabled={loading}>{loading ? t('companies.edit_modal.form.saving') : t('companies.edit_modal.form.save_changes')}</Button>
                    </div>
                </form>
            </div >
        </div >
    );
}
