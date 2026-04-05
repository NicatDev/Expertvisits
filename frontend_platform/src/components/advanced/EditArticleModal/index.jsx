import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { content } from '@/lib/api';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import RichTextEditor from '@/components/ui/RichTextEditor';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function EditArticleModal({ isOpen, onClose, article, onSuccess }) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [data, setData] = useState({ title: '', body: '', image: null });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (isOpen && article) {
            setData({
                title: article.title,
                body: article.body,
                image: null
            });
            setPreviewUrl(article.image || null);
        }
    }, [isOpen, article]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData({ ...data, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setData({ ...data, image: null });
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!data.title.trim() || !data.body.trim()) {
            toast.error(t('edit_modal.required_error'));
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('title', data.title);
            fd.append('body', data.body);
            if (data.image) fd.append('image', data.image);

            const res = await content.updateArticle(article.slug, fd);

            toast.success(t('edit_modal.success'));
            if (onSuccess) onSuccess(res.data); // Return updated data
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(t('edit_modal.error'));
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} color="#666" />
                </button>

                <h2>{t('edit_modal.title')}</h2>

                <div className={styles.formContent}>
                    <Input
                        label={t('edit_modal.post_title')}
                        value={data.title}
                        onChange={e => setData({ ...data, title: e.target.value })}
                    />

                    <div className={styles.fieldGroup}>
                        <label>{t('edit_modal.cover_image')}</label>
                        <div className={styles.uploadContainer} onClick={() => fileInputRef.current?.click()}>
                            {previewUrl ? (
                                <div className={styles.previewImage}>
                                    <img src={previewUrl} alt="Preview" />
                                    <button className={styles.removeBtn} onClick={removeImage}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.uploadTrigger}>
                                    <ImageIcon size={32} />
                                    <span>{t('edit_modal.change_image')}</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label>{t('edit_modal.content')}</label>
                        <RichTextEditor
                            content={data.body}
                            onChange={html => setData({ ...data, body: html })}
                            placeholder={t('create_modal.content_placeholder')}
                        />
                    </div>

                    <div className={styles.actions}>
                        <Button type="default" onClick={onClose}>{t('edit_modal.cancel')}</Button>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>{t('edit_modal.save')}</Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
