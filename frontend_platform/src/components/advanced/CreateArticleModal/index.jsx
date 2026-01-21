import React, { useState, useRef } from 'react';
import { content } from '@/lib/api';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import RichTextEditor from '@/components/ui/RichTextEditor';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function CreateArticleModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [articleData, setArticleData] = useState({ title: '', body: '', image: null });
    const [previewUrl, setPreviewUrl] = useState(null);

    React.useEffect(() => {
        if (isOpen && initialData) {
            setArticleData({
                title: initialData.title,
                body: initialData.body,
                image: null
            });
            if (initialData.image) setPreviewUrl(initialData.image);
        } else if (isOpen && !initialData) {
            setArticleData({ title: '', body: '', image: null });
            setPreviewUrl(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArticleData({ ...articleData, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setArticleData({ ...articleData, image: null });
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('title', articleData.title);
            fd.append('body', articleData.body);
            if (articleData.image) fd.append('image', articleData.image);

            if (initialData) {
                await content.updateArticle(initialData.slug, fd);
            } else {
                await content.createArticle(fd);
            }

            toast.success(initialData ? 'Content updated!' : 'Article created successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} color="#666" />
                </button>

                <h2>{initialData ? t('create_modal.edit_article') : t('create_modal.create_article')}</h2>

                <div className={styles.formContent}>
                    <Input label={t('create_modal.post_title')} value={articleData.title} onChange={e => setArticleData({ ...articleData, title: e.target.value })} />

                    <div className={styles.fieldGroup}>
                        <label>{t('create_modal.content')}</label>
                        <RichTextEditor
                            content={articleData.body}
                            onChange={html => setArticleData({ ...articleData, body: html })}
                            placeholder={t('create_modal.content_placeholder') || 'Start writing...'}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label>{t('create_modal.cover_image')}</label>
                        <div className={styles.uploadContainer} onClick={() => fileInputRef.current.click()}>
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
                                    <span>{t('create_modal.upload_placeholder')}</span>
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

                    <div className={styles.actions}>
                        <Button type="default" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>
                            {loading ? t('create_modal.posting') : t('create_modal.post_btn')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
