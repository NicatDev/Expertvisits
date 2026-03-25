"use client";
import React, { useState } from 'react';
import { X, CheckCircle, LayoutTemplate, PaintBucket, Briefcase } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { websites_api } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './modal.module.scss';

export default function TemplateSelectionModal({ isOpen, onClose }) {
    const { t } = useTranslation('common');
    const [selected, setSelected] = useState(2);
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const [isFetching, setIsFetching] = useState(true);

    React.useEffect(() => {
        if (isOpen) {
            fetchCurrentTemplate();
        }
    }, [isOpen]);

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

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await websites_api.updateTemplate(selected);
            toast.success(t('widgets.success_msg') || 'Template saved successfully!');
            onClose();
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
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to deactivate template');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{t('widgets.create_website_modal_title')}</h3>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20}/></button>
                </div>
                
                <div className={styles.body}>
                    <p className={styles.label}>{t('widgets.select_template')}</p>
                    
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
                                <span className={styles.templateName}>{t('widgets.template1_name')}</span>
                                {selected === 1 && <CheckCircle className={styles.checkIcon} size={20}/>}
                            </div>

                            <div 
                                className={`${styles.option} ${selected === 2 ? styles.active : ''}`}
                                onClick={() => setSelected(2)}
                            >
                                <div className={styles.iconBox}><PaintBucket size={24}/></div>
                                <span className={styles.templateName}>{t('widgets.template2_name')}</span>
                                {selected === 2 && <CheckCircle className={styles.checkIcon} size={20}/>}
                            </div>

                            <div 
                                className={`${styles.option} ${selected === 3 ? styles.active : ''}`}
                                onClick={() => setSelected(3)}
                            >
                                <div className={styles.iconBox}><Briefcase size={24}/></div>
                                <span className={styles.templateName}>{t('widgets.template3_name')}</span>
                                {selected === 3 && <CheckCircle className={styles.checkIcon} size={20}/>}
                            </div>
                        </div>
                    )}

                    <div className={styles.disclaimer}>
                        {t('widgets.contact_disclaimer')}
                    </div>
                </div>

                <div className={styles.footer} style={{ display: 'flex', gap: '10px' }}>
                    {isActive && (
                        <button 
                            className={styles.deactivateBtn} 
                            onClick={handleDeactivate} 
                            disabled={loading}
                            style={{ padding: '12px 24px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            {t('widgets.deactivate_website') || 'Deactivate Website'}
                        </button>
                    )}
                    <button 
                        className={styles.saveBtn} 
                        onClick={handleSave} 
                        disabled={loading}
                        style={{ flex: 1 }}
                    >
                        {loading ? (t('widgets.saving') || 'Saving...') : t('widgets.save_template')}
                    </button>
                </div>
            </div>
        </div>
    );
}
