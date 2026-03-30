import React, { useState, useRef } from 'react';
import { content } from '@/lib/api';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { X, Image as ImageIcon, Crop } from 'lucide-react';
import { toast } from 'react-toastify';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageCropModal from '@/components/ui/ImageCropModal';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function CreateArticleModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [articleData, setArticleData] = useState({ title: '', body: '', image: null });
    const [previewUrl, setPreviewUrl] = useState(null);

    // Crop state
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

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
            const reader = new FileReader();
            reader.onload = () => {
                setCropImageSrc(reader.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCropComplete = (croppedBlob, croppedUrl) => {
        const croppedFile = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
        setArticleData({ ...articleData, image: croppedFile });
        setPreviewUrl(croppedUrl);
        setShowCropper(false);
        setCropImageSrc(null);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setCropImageSrc(null);
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setArticleData({ ...articleData, image: null });
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const reCropImage = (e) => {
        e.stopPropagation();
        if (previewUrl) {
            setCropImageSrc(previewUrl);
            setShowCropper(true);
        }
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
        <>
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
                                        <div className={styles.imageActions}>
                                            <button className={styles.cropBtn} onClick={reCropImage} title="Yenidən kəs">
                                                <Crop size={14} />
                                            </button>
                                            <button className={styles.removeBtn} onClick={removeImage} title="Sil">
                                                <X size={14} />
                                            </button>
                                        </div>
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
                                {loading ? t('create_modal.post_btn') : t('create_modal.post_btn')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {showCropper && cropImageSrc && (
                <ImageCropModal
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCropComplete}
                    onClose={handleCropCancel}
                    aspectRatio={16 / 9}
                />
            )}
        </>
    );
}
