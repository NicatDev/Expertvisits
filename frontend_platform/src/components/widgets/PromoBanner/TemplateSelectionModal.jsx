'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, LayoutTemplate, PaintBucket, Briefcase } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { websites_api, content, profiles } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';
import styles from './modal.module.scss';
import Link from 'next/link';

export default function TemplateSelectionModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth(); // Rename to avoid any potential shadowing
    
    const [selected, setSelected] = useState(2);
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [articlesCount, setArticlesCount] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (isOpen && currentUser?.id) {
            fetchCurrentTemplate();
            fetchArticlesCount();
            fetchProfileData();
            setShowSuccess(false); // Reset when reopened
        }
    }, [isOpen, currentUser]);

    const fetchProfileData = async () => {
        if (!currentUser) return;
        try {
            // timestamp array bypasses browser cache
            const { data } = await profiles.getProfileDetails(currentUser.id, { params: { t: new Date().getTime() } });
            
            // Prioritize fresh data from db, fallback to context
            const summary = data.summary !== undefined ? data.summary : currentUser.summary;
            const phone = data.phone_number !== undefined ? data.phone_number : currentUser.phone_number;
            
            const requiredFields = [
                !!summary, // Summary
                !!(data.first_name !== undefined ? data.first_name : currentUser.first_name),
                !!(data.last_name !== undefined ? data.last_name : currentUser.last_name),
                !!(data.username !== undefined ? data.username : currentUser.username),
                !!(data.email !== undefined ? data.email : currentUser.email),
                !!phone,
                !!(data.birth_day !== undefined ? data.birth_day : (data.birth_date !== undefined ? data.birth_date : currentUser.birth_day)),
                !!(data.city !== undefined ? data.city : currentUser.city),
                !!(data.profession_sub_category !== undefined ? data.profession_sub_category : currentUser.profession_sub_category),
                !!(data.experience && data.experience.length > 0),
                !!(data.education && data.education.length > 0),
                !!(data.skills && data.skills.some(s => s.skill_type === 'hard')),
                !!(data.skills && data.skills.some(s => s.skill_type === 'soft')),
                !!(data.languages && data.languages.length > 0),
                !!(data.certificates && data.certificates.length > 0)
            ];
            const completed = requiredFields.filter(Boolean).length;
            setProgress(Math.round((completed / requiredFields.length) * 100));
        } catch (error) {
            console.error("Failed to fetch profile info for progress", error);
        }
    };

    const fetchCurrentTemplate = async () => {
        setIsFetching(true);
        try {
            const { data } = await websites_api.getTemplate();
            if (data?.template_id) setSelected(data.template_id);
            if (data?.is_active) setIsActive(true);
        } catch (error) {
            console.error("Failed to fetch current template", error);
        } finally {
            setIsFetching(false);
        }
    };

    const fetchArticlesCount = async () => {
        try {
            const res = await content.getArticleStats();
            setArticlesCount(res.data.count || 0);
        } catch (error) {
            console.error("Failed to fetch article count", error);
        }
    };

    if (!isOpen) return null;

    const handleSave = async () => {
        if (progress < 60) {
            toast.error(t('widgets.profile_completion_desc') || 'Profilinizin ən azı 60% tamamlanması lazımdır.');
            return;
        }

        setLoading(true);
        try {
            await websites_api.updateTemplate(selected);
            toast.success(t('widgets.success_msg') || 'Template saved successfully!');
            setShowSuccess(true);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            await websites_api.deactivateTemplate();
            toast.success(t('widgets.deactivate_success_msg') || 'Website deactivated successfully!');
            setIsActive(false);
            onClose();
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to deactivate template');
        } finally {
            setLoading(false);
        }
    };

    const websiteUrl = currentUser?.username ? `https://expertvisits.com/u/${currentUser.username}` : '#';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{showSuccess ? (t('widgets.success_msg') || 'Success!') : (t('widgets.create_website_modal_title') || 'Create your Portfolio')}</h3>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20}/></button>
                </div>
                
                <div className={styles.body}>
                    {showSuccess ? (
                        <div className={styles.successContent}>
                            <div className={styles.successIcon}>
                                <CheckCircle size={32} />
                            </div>
                            <h4>{t('widgets.success_msg') || 'Website Ready!'}</h4>
                            <p>{t('widgets.visit_website_desc') || 'Your personal portfolio website is now live and updated.'}</p>
                            
                            <div className={styles.urlBox}>
                                <span>{t('widgets.website_url') || 'Your Website URL'}</span>
                                <Link 
                                    href={websiteUrl} 
                                    target="_blank"
                                >
                                    {websiteUrl}
                                </Link>
                            </div>

                            <button 
                                className={styles.doneBtn}
                                onClick={() => {
                                    onClose();
                                    window.location.reload();
                                }} 
                            >
                                {t('quiz_modal.close') || 'Done'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className={styles.label}>{t('widgets.select_template') || 'Select a template:'}</p>
                            
                            {isFetching ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                    {t('common.loading') || 'Loading...'}
                                </div>
                            ) : (
                                <div className={styles.options}>
                                    <div 
                                        className={`${styles.option} ${selected === 1 ? styles.active : ''}`}
                                        onClick={() => setSelected(1)}
                                    >
                                        <div className={styles.iconBox}><LayoutTemplate size={24}/></div>
                                        <span className={styles.templateName}>{t('widgets.template1_name') || 'Dark Modern'}</span>
                                        {selected === 1 && <CheckCircle className={styles.checkIcon} size={20}/>}
                                    </div>

                                    <div 
                                        className={`${styles.option} ${selected === 2 ? styles.active : ''}`}
                                        onClick={() => setSelected(2)}
                                    >
                                        <div className={styles.iconBox}><PaintBucket size={24}/></div>
                                        <span className={styles.templateName}>{t('widgets.template2_name') || 'Light Interactive'}</span>
                                        {selected === 2 && <CheckCircle className={styles.checkIcon} size={20}/>}
                                    </div>

                                    <div 
                                        className={`${styles.option} ${selected === 3 ? styles.active : ''}`}
                                        onClick={() => setSelected(3)}
                                    >
                                        <div className={styles.iconBox}><Briefcase size={24}/></div>
                                        <span className={styles.templateName}>{t('widgets.template3_name') || 'Corporate'}</span>
                                        {selected === 3 && <CheckCircle className={styles.checkIcon} size={20}/>}
                                    </div>
                                </div>
                            )}

                            <div className={styles.disclaimer} style={{ marginBottom: '24px' }}>
                                {t('widgets.contact_disclaimer') || 'Please note: Information displayed on your website, including contact details, is taken from your main profile. Edit your profile to update the information. This service is completely free, and you can change the template at any time.'}
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Profile Progress */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>{t('widgets.profile_completion') || 'Profil Tamamlanması'}</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: progress >= 60 ? '#10b981' : '#ef4444' }}>{progress}%</span>
                                    </div>
                                    <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${progress}%`, height: '100%', background: progress >= 60 ? '#10b981' : '#ef4444', transition: 'width 0.4s ease' }} />
                                    </div>
                                    {progress < 60 && (
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '8px', lineHeight: '1.4' }}>
                                            {t('widgets.profile_completion_desc') || 'Veb sayt yaratmaq üçün minimum 60% tələb olunur (Ad, soyad, email, şəkil, nömrə, summary, təhsil, təcrübə, bacarıq, dil və sertifikat nəzərə alınır).'}
                                            <Link href="/profile" onClick={onClose} style={{ color: '#4f46e5', marginLeft: '6px', textDecoration: 'none', fontWeight: '600' }}>{t('widgets.go_to_profile') || 'Profilə keç →'}</Link>
                                        </p>
                                    )}
                                </div>

                                {/* Divider */}
                                <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>

                                {/* Articles Progress */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>{t('widgets.articles') || 'Məqalələr'}</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: articlesCount >= 3 ? '#10b981' : '#f59e0b' }}>
                                            {articlesCount} / 3
                                        </span>
                                    </div>
                                    <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min((articlesCount / 3) * 100, 100)}%`, height: '100%', background: articlesCount >= 3 ? '#10b981' : '#f59e0b', transition: 'width 0.4s ease' }} />
                                    </div>
                                    {articlesCount < 3 && (
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '8px' }}>
                                            {t('widgets.articles_desc') || 'Məqalə səhifəsinin görünməsi üçün minimum 3 məqalə tələb olunur.'}
                                            <Link href="/my-articles" onClick={onClose} style={{ color: '#4f46e5', marginLeft: '6px', textDecoration: 'none', fontWeight: '600' }}>{t('widgets.go_to_articles') || 'Məqalələrə keç →'}</Link>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {!showSuccess && (
                    <div className={styles.footer} style={{ display: 'flex', gap: '10px' }}>
                        {isActive && (
                            <button 
                                className={styles.deactivateBtn} 
                                onClick={handleDeactivate} 
                                disabled={loading}
                                style={{ padding: '12px 24px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                {t('widgets.deactivate_website') || 'Cancel Website'}
                            </button>
                        )}
                        <button 
                            className={styles.saveBtn} 
                            onClick={handleSave} 
                            disabled={loading || progress < 60}
                            style={{ flex: 1, opacity: (progress < 60) ? 0.6 : 1, cursor: (progress < 60) ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? (t('widgets.saving') || 'Saving...') : (t('widgets.save_template') || 'Save template')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
