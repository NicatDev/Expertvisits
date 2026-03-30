"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n/client';
import { useProfile } from '../context';
import { profiles } from '@/lib/api';
import styles from '../profile.module.scss';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ImageCropModal from '@/components/ui/ImageCropModal';
import { toast } from 'react-toastify';

// Local Form Modal wrapper 
const FormModal = ({ isOpen, onClose, title, onSubmit, loading, children, bodyStyle }) => {
    const { t } = useTranslation('common');
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} bodyStyle={bodyStyle}>
            <form onSubmit={onSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {children}
                </div>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Button type="default" onClick={onClose} disabled={loading}>{t('profile_modals.cancel') || 'Cancel'}</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>{t('profile_modals.save') || 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const ProjectModal = ({ isOpen, onClose, initialData, onSave }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ title: '', description: '', date: '' });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    
    // Crop logic
    const fileInputRef = useRef(null);
    const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({ title: initialData.title, description: initialData.description, date: initialData.date });
            setImagePreview(initialData.image || null);
            setImageFile(null);
        } else {
            setFormData({ title: '', description: '', date: '' });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [initialData, isOpen]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
             setCropModal({ isOpen: true, imageSrc: reader.result });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropComplete = (croppedBlob, croppedUrl) => {
        const croppedFile = new File([croppedBlob], `project-${Date.now()}.png`, { type: 'image/png' });
        setImageFile(croppedFile);
        setImagePreview(croppedUrl);
        setCropModal({ isOpen: false, imageSrc: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('description', formData.description);
        submitData.append('date', formData.date);

        if (imageFile) {
            submitData.append('image', imageFile);
        } else if (!imageFile && !imagePreview && initialData?.image) {
            submitData.append('image', ''); 
        }

        await onSave(submitData);
        setLoading(false);
        onClose();
    };

    return (
        <>
            <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? t('profile.tabs.projects') + ' Edit' : t('profile.tabs.projects') + ' ' + t('profile_modals.service.add', 'Add')} onSubmit={handleSubmit} loading={loading}>
                <Input label={t('profile_modals.service.title') || 'Title'} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t('profile_modals.service.description') || 'Description'}</label>
                    <textarea 
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', minHeight: '80px', fontFamily: 'inherit' }}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
                <Input type="date" label={t('profile_modals.experience.start') || 'Date'} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />

                <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>Şəkil (Opsional)</label>
                    {imagePreview ? (
                        <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Dəyiş</button>
                                <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} style={{ background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Sil</button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            style={{ width: '100%', height: '150px', border: '2px dashed #d9d9d9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', color: '#888' }}
                        >
                            + Şəkil Yüklə
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
                </div>
            </FormModal>

            {cropModal.isOpen && cropModal.imageSrc && (
                <ImageCropModal
                    imageSrc={cropModal.imageSrc}
                    onCropComplete={handleCropComplete}
                    onClose={() => setCropModal({ isOpen: false, imageSrc: null })}
                    aspectRatio={16/9}
                />
            )}
        </>
    );
};

export default function ProjectsPage() {
    const { t } = useTranslation('common');
    const { profile, loading: profileLoading, isOwner } = useProfile();
    const [projects, setProjects] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(true);
    
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [viewModalProject, setViewModalProject] = useState(null);

    useEffect(() => {
        if (profile?.id) loadProjects();
    }, [profile]);

    const loadProjects = async () => {
        try {
            const { data } = await profiles.getProjects({ user_id: profile.id });
            setProjects(data.results || data || []);
        } catch (err) {
            console.error("Failed to load projects", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });
    const openViewModal = (project) => setViewModalProject(project);
    const closeViewModal = () => setViewModalProject(null);

    const handleSaveItem = async (formData) => {
        const { data } = modalState;
        const isEdit = !!(data && data.id);
        try {
            if (isEdit) await profiles.updateProject(data.id, formData);
            else await profiles.addProject(formData);
            
            loadProjects();
            closeModal();
            toast.success(t('profile.toasts.availability_saved') || 'Saved successfully');
        } catch (err) {
            console.error(err);
            toast.error(t('profile.toasts.failed_update') || 'Failed to update');
        }
    };

    const handleDelete = (id) => {
        setConfirmationModal({
            isOpen: true,
            title: t('profile.modals.delete_title') || 'Delete',
            message: t('profile.modals.delete_message') || 'Are you sure?',
            onConfirm: async () => {
                try {
                    await profiles.deleteProject(id);
                    loadProjects();
                    toast.success(t('profile.toasts.deleted') || 'Deleted successfully');
                } catch (err) {
                    toast.error(t('profile.toasts.failed_delete') || 'Failed to delete');
                }
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    if (profileLoading || loadingDetails) return <div style={{ padding: '20px' }}>{t('common.loading') || 'Loading...'}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.section} style={{ padding: '0', background: 'transparent', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {t('profile.tabs.projects', 'Layihələr')}
                    </h2>
                    {isOwner && (
                        <button onClick={() => openModal('project')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }}>
                            <span style={{ fontSize: '1.2rem' }}>+</span> Layihə əlavə et
                        </button>
                    )}
                </div>

                {projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                        Layihə yoxdur.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {projects.map(item => (
                            <div 
                                key={item.id} 
                                style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column' }}
                                onClick={() => openViewModal(item)}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                                <div style={{ width: '100%', height: '160px', background: '#f3f4f6', position: 'relative' }}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No Image</div>
                                    )}
                                    {isOwner && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                                            <button onClick={(e) => { e.stopPropagation(); openModal('project', item); }} style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>✎</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>✖</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#111827' }}>{item.title}</h3>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>{item.date}</div>
                                    <p style={{ color: '#4b5563', fontSize: '0.95rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.description}
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        <span style={{ color: '#2563eb', fontWeight: '500', fontSize: '0.9rem' }}>Ətraflı bax →</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ProjectModal 
                isOpen={modalState.type === 'project'} 
                onClose={closeModal} 
                initialData={modalState.data} 
                onSave={handleSaveItem} 
            />

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
            />

            {/* Detail View Modal */}
            {viewModalProject && (
                <Modal isOpen={!!viewModalProject} onClose={closeViewModal} title={viewModalProject.title} bodyStyle={{ padding: 0 }}>
                    {viewModalProject.image && (
                        <div style={{ width: '100%', maxHeight: '400px', overflow: 'hidden', background: '#f3f4f6' }}>
                            <img src={viewModalProject.image} alt={viewModalProject.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                    )}
                    <div style={{ padding: '24px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>Tarix: {viewModalProject.date}</div>
                        <p style={{ color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{viewModalProject.description}</p>
                    </div>
                </Modal>
            )}
        </div>
    );
}
