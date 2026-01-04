"use client";
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { X, Upload } from 'lucide-react';
import styles from './Modals.module.scss';
import { business } from '@/lib/api';

export default function EditSectionModal({ isOpen, onClose, sectionType, initialData, companyId, onSuccess }) {
    const [formData, setFormData] = useState({ title: '', description: '', image: null });
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                image: null // We don't preload the file object, just preview
            });
            setPreview(initialData.image);
        } else if (isOpen) {
            setFormData({ title: '', description: '', image: null });
            setPreview(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('company', companyId);
        data.append('title', formData.title);
        data.append('description', formData.description);
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            // Determine API call based on sectionType and mode (create/update)
            // sectionType: 'who-we-are', 'what-we-do', 'our-values', 'services'

            let funcName;
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
                // Update
                // For update, we might not need to send 'company' again but it's safe.
                await updateFunc(initialData.id, data);
            } else {
                // Create
                await createFunc(data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save section", error);
            // Handle error (maybe toast)
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

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{initialData ? 'Edit Section' : 'Add Section'}</h2>
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
                            {preview && <img src={preview} alt="Preview" className={styles.preview} />}
                            <label className={styles.uploadBtn}>
                                <Upload size={18} /> Choose Image
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
