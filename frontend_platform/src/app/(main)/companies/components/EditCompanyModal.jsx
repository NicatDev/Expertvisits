"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import { X, Upload } from 'lucide-react';
import styles from './Modals.module.scss';
import { business } from '@/lib/api';

export default function EditCompanyModal({ isOpen, onClose, company, onSuccess }) {
    const [formData, setFormData] = useState({});
    const [logoPreview, setLogoPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isLogoDeleted, setIsLogoDeleted] = useState(false);

    useEffect(() => {
        if (isOpen && company) {
            setFormData({
                name: company.name,
                summary: company.summary,
                phone: company.phone || '',
                email: company.email || '',
                address: company.address || '',
                website_url: company.website_url || '',
                linkedin_url: company.linkedin_url || '',
                instagram_url: company.instagram_url || '',
                facebook_url: company.facebook_url || ''
            });
            setLogoPreview(company.logo);
            setIsLogoDeleted(false);
            setCoverPreview(company.cover_image);
        }
    }, [isOpen, company]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, [field]: file });
            if (field === 'logo') {
                setLogoPreview(URL.createObjectURL(file));
                setIsLogoDeleted(false);
            }
        }
    };

    const handleDeleteLogo = () => {
        setLogoPreview(null);
        setFormData({ ...formData, logo: null });
        setIsLogoDeleted(true);
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                // Skip sending url strings for files if they haven't changed (logic check)
                // Actually, if we send 'logo': 'http://...' (string) to ImageField, Django ignores it or errors?
                // Django REST Framework ImageField expects a file. If we send a URL string, it often fails validation.
                // We should ONLY send 'logo' if it is a File object (new upload).
                // Existing logic:
                /*
               if ((key === 'logo' || key === 'cover_image')) {
                   if (formData[key] instanceof File) {
                       data.append(key, formData[key]);
                   }
               } else {
                   data.append(key, formData[key]);
               }
               */
                // Let's refine this to be safe.
                if (key === 'logo' || key === 'cover_image') {
                    if (formData[key] instanceof File) {
                        data.append(key, formData[key]);
                    }
                } else {
                    data.append(key, formData[key]);
                }
            }
        });

        if (isLogoDeleted) {
            data.append('delete_logo', 'true');
        }

        try {
            console.log("Submitting company update:", Object.fromEntries(data.entries())); // Debug log
            await business.updateCompany(company.slug, data);
            toast.success("Company profile updated successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update company", error);
            const msg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || "Failed to update company";
            // If validation errors (dict), show first one?
            if (error.response?.data && typeof error.response.data === 'object') {
                // e.g. { email: ["Enter a valid email."] }
                const firstKey = Object.keys(error.response.data)[0];
                const firstError = error.response.data[firstKey];
                if (Array.isArray(firstError)) {
                    toast.error(`${firstKey}: ${firstError[0]}`);
                } else {
                    toast.error(typeof firstError === 'string' ? firstError : msg);
                }
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Edit Company Profile</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Company Name</label>
                            <input name="name" value={formData.name || ''} onChange={handleChange} required />
                        </div>
                        <div className={styles.field}>
                            <label>Phone (Visible to you)</label>
                            <input name="phone" value={formData.phone || ''} onChange={handleChange} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Summary</label>
                        <textarea name="summary" rows={4} value={formData.summary || ''} onChange={handleChange} required />
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Website URL</label>
                            <input name="website_url" value={formData.website_url || ''} onChange={handleChange} />
                        </div>
                        <div className={styles.field}>
                            <label>Address</label>
                            <input name="address" value={formData.address || ''} onChange={handleChange} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Logo</label>
                        <div className={styles.imageUpload}>
                            {logoPreview && (
                                <div className={styles.previewContainer}>
                                    <img src={logoPreview} alt="Logo" className={styles.preview} />
                                    <button type="button" onClick={handleDeleteLogo} className={styles.deleteFileBtn}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <label className={styles.uploadBtn}>
                                <Upload size={18} /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                <input type="file" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" hidden />
                            </label>
                        </div>
                    </div>

                    <h3>Social Links</h3>
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

                    <div className={styles.actions}>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button htmlType="submit" type="primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
