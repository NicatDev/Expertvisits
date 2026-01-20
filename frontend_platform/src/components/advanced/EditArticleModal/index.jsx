import React, { useState, useRef, useEffect } from 'react';
import { content } from '@/lib/api';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

export default function EditArticleModal({ isOpen, onClose, article, onSuccess }) {
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
            toast.error("Title and body are required");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('title', data.title);
            fd.append('body', data.body);
            if (data.image) fd.append('image', data.image);

            const res = await content.updateArticle(article.slug, fd);

            toast.success("Article updated!");
            if (onSuccess) onSuccess(res.data); // Return updated data
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update article");
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

                <h2>Edit Article</h2>

                <div className={styles.formContent}>
                    <Input
                        label="Title"
                        value={data.title}
                        onChange={e => setData({ ...data, title: e.target.value })}
                    />

                    <div className={styles.fieldGroup}>
                        <label>Cover Image</label>
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
                                    <span>Change cover image</span>
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
                        <label>Content</label>
                        <textarea
                            value={data.body}
                            onChange={e => setData({ ...data, body: e.target.value })}
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.actions}>
                        <Button type="default" onClick={onClose}>Cancel</Button>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
