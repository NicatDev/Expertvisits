"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react';
import styles from './style.module.scss';
import { business } from '@/lib/api';
import { useTranslation } from '@/i18n/client';

const SECTION_I18N_KEY = {
    'who-we-are': 'who_we_are',
    'what-we-do': 'what_we_do',
    'our-values': 'our_values',
};

export default function EditSectionModal({ isOpen, onClose, sectionType, initialData, companyId, onSuccess }) {
    const { t } = useTranslation('common');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const sectionKey = SECTION_I18N_KEY[sectionType];
    const modalTitle = useMemo(() => {
        if (!sectionKey) return '';
        const mode = initialData ? 'edit' : 'add';
        return t(`company_detail.section_modal.${mode}.${sectionKey}`);
    }, [t, sectionKey, initialData]);

    useEffect(() => {
        if (isOpen && initialData) {
            setDescription(initialData.description || '');
        } else if (isOpen) {
            setDescription('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            company: companyId,
            description: description.trim(),
        };

        try {
            let createFunc;
            let updateFunc;

            switch (sectionType) {
                case 'who-we-are':
                    createFunc = business.createWhoWeAre;
                    updateFunc = business.updateWhoWeAre;
                    break;
                case 'what-we-do':
                    createFunc = business.createWhatWeDo;
                    updateFunc = business.updateWhatWeDo;
                    break;
                case 'our-values':
                    createFunc = business.createOurValue;
                    updateFunc = business.updateOurValue;
                    break;
                default:
                    setLoading(false);
                    return;
            }

            if (initialData?.id) {
                await updateFunc(initialData.id, payload);
            } else {
                await createFunc(payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save section', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('company_detail.section_modal.delete_confirm'))) return;
        setLoading(true);
        try {
            let deleteFunc;
            switch (sectionType) {
                case 'who-we-are':
                    deleteFunc = business.deleteWhoWeAre;
                    break;
                case 'what-we-do':
                    deleteFunc = business.deleteWhatWeDo;
                    break;
                case 'our-values':
                    deleteFunc = business.deleteOurValue;
                    break;
                default:
                    setLoading(false);
                    return;
            }
            await deleteFunc(initialData.id);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to delete', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !sectionKey) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{modalTitle}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn} aria-label={t('common.cancel')}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="section-body">{t('company_detail.section_modal.text_label')}</label>
                        <textarea
                            id="section-body"
                            required
                            rows={8}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={styles.actions}>
                        {initialData?.id && (
                            <Button type="button" variant="outline" className={styles.deleteBtn} onClick={handleDelete} disabled={loading}>
                                {t('company_detail.section_modal.delete')}
                            </Button>
                        )}
                        <div style={{ flex: 1 }} />
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('company_detail.section_modal.cancel')}
                        </Button>
                        <Button htmlType="submit" type="primary" disabled={loading}>
                            {loading ? t('company_detail.section_modal.saving') : t('company_detail.section_modal.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
