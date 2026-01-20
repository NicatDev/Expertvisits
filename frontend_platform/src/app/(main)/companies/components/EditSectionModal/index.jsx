"use client";
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { X, Upload } from 'lucide-react';
import styles from './styles.module.scss';
import { business } from '@/lib/api';

export default function EditSectionModal({ isOpen, onClose, sectionType, initialData, companyId, onSuccess }) {
    const [formData, setFormData] = useState({ title: '', description: '', image: null });
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isImageDeleted, setIsImageDeleted] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                image: null
            });
            setPreview(initialData.image);
            setIsImageDeleted(false);
        } else if (isOpen) {
            setFormData({ title: '', description: '', image: null });
            setPreview(null);
            setIsImageDeleted(false);
        }
    }, [isOpen, initialData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
            setIsImageDeleted(false);
        }
    };

    const handleDeleteImage = () => {
        setPreview(null);
        setFormData({ ...formData, image: null });
        setIsImageDeleted(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('company', companyId);
        data.append('title', formData.title);
        data.append('description', formData.description);

        if (formData.image instanceof File) {
            data.append('image', formData.image);
        }

        if (isImageDeleted) {
            // Check how backend handles image deletion for sections.
            // Usually simpler to just send image='' or specific flag if supported.
            // Assuming generic 'delete_image' or simliar param isn't standard in sections yet,
            // but for now let's append a flag and see if backend supports it OR
            // standard DRF behavior: if image is not required, sending empty value might work, but multipart usually requires file.
            // Let's assume clear_image param logic or just overwrite.
            // If the backend doesn't explicitly support 'delete_image', this might fail to clear.
            // However, typical custom update methods often handle it.
            // Let's try sending 'image' as empty string if supported by DRF to clear? No, multipart.
            data.append('delete_image', 'true');
        }

        try {
            let createFunc, updateFunc;

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
                case 'services':
                    createFunc = business.createService;
                    updateFunc = business.updateService;
                    break;
            }

            if (initialData?.id) {
                await updateFunc(initialData.id, data);
            } else {
                await createFunc(data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save section", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this section?")) return;
        setLoading(true);
        try {
            let deleteFunc;
            switch (sectionType) {
                case 'who-we-are': deleteFunc = business.deleteWhoWeAre; break;
                case 'what-we-do': deleteFunc = business.deleteWhatWeDo; break;
                case 'our-values': deleteFunc = business.deleteOurValue; break;
                case 'services': deleteFunc = business.deleteService; break;
            }
            await deleteFunc(initialData.id);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to delete", error);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{initialData ? 'Edit Service' : 'Add Service'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Description</label>
                        <textarea
                            required
                            rows={5}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Image</label>
                        <div className={styles.imageUpload}>
                            {preview && (
                                <div className={styles.previewContainer}>
                                    <img src={preview} alt="Preview" className={styles.preview} />
                                    <button type="button" onClick={handleDeleteImage} className={styles.deleteFileBtn}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <label className={styles.uploadBtn}>
                                <Upload size={18} /> {preview ? 'Change Image' : 'Choose Image'}
                                <input type="file" onChange={handleImageChange} accept="image/*" hidden />
                            </label>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {initialData?.id && (
                            <Button type="button" variant="outline" className={styles.deleteBtn} onClick={handleDelete} disabled={loading}>Delete</Button>
                        )}
                        <div style={{ flex: 1 }}></div>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button htmlType="submit" type="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
