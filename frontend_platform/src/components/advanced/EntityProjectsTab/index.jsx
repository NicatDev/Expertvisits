"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@/i18n/client';
import { profiles } from '@/lib/api';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ImageCropModal from '@/components/ui/ImageCropModal';
import { toast } from 'react-toastify';
import { ExternalLink } from 'lucide-react';
import styles from './style.module.scss';

/** API may return YYYY-MM-DD or ISO datetime; <input type="date"> only accepts YYYY-MM-DD */
function formatProjectDateForInput(value) {
    if (value == null || value === '') return '';
    const s = String(value).trim();
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
}

function formatProjectDateForDisplay(value) {
    const normalized = formatProjectDateForInput(value);
    if (normalized) return normalized;
    return value != null && value !== '' ? String(value) : '';
}

const FormModal = ({ isOpen, onClose, title, onSubmit, loading, children, bodyStyle }) => {
    const { t } = useTranslation('common');
    const formId = 'modal-form-' + Math.random().toString(36).substr(2, 9);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            bodyStyle={bodyStyle}
            footer={
                <>
                    <Button type="default" onClick={onClose} disabled={loading}>
                        {t('profile_modals.cancel') || 'Cancel'}
                    </Button>
                    <Button type="primary" htmlType="submit" form={formId} loading={loading}>
                        {t('profile_modals.save') || 'Save'}
                    </Button>
                </>
            }
        >
            <form id={formId} onSubmit={onSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
            </form>
        </Modal>
    );
};

function ProjectModal({ isOpen, onClose, initialData, onSave }) {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({ title: '', description: '', date: '', url: '' });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);
    const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description,
                date: formatProjectDateForInput(initialData.date),
                url: initialData.url || '',
            });
            setImagePreview(initialData.image || null);
            setImageFile(null);
        } else {
            setFormData({ title: '', description: '', date: '', url: '' });
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
        submitData.append('url', (formData.url || '').trim());
        if (imageFile) {
            submitData.append('image', imageFile);
        } else if (!imageFile && !imagePreview && initialData?.image) {
            submitData.append('image', '');
        }
        try {
            await onSave(submitData);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <FormModal
                isOpen={isOpen}
                onClose={onClose}
                title={initialData ? t('profile_modals.project.edit') : t('profile_modals.project.add')}
                onSubmit={handleSubmit}
                loading={loading}
            >
                <Input
                    label={t('profile_modals.project.title_label')}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                />
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
                        {t('profile_modals.project.description_label')}
                    </label>
                    <textarea
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            minHeight: '80px',
                            fontFamily: 'inherit',
                        }}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
                <Input
                    type="date"
                    label={t('profile_modals.project.date_label')}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                />
                <Input
                    type="url"
                    label={t('profile_modals.project.url_label')}
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://"
                />
                <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
                        {t('profile_modals.project.image_label')}
                    </label>
                    {imagePreview ? (
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '200px',
                                borderRadius: '12px',
                                border: '1px solid #ddd',
                                padding: '12px',
                                background: '#f9f9f9',
                            }}
                        >
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                            />
                            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        background: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                    }}
                                >
                                    {t('common.change')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePreview(null);
                                        setImageFile(null);
                                    }}
                                    style={{
                                        background: '#ff4d4f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                    }}
                                >
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100%',
                                height: '150px',
                                border: '2px dashed #d9d9d9',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: '#fafafa',
                                color: '#888',
                            }}
                        >
                            + {t('profile_modals.project.upload_image')}
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
                    aspectRatio={1}
                />
            )}
        </>
    );
}

/**
 * @param {'profile'|'company'} scope
 * @param {boolean} isOwner
 * @param {number} [profileUserId]
 * @param {number} [companyId]
 * @param {Array} [projectsFromParent] — company.company_projects
 * @param {() => Promise<void>} [onRefresh]
 */
export default function EntityProjectsTab({
    scope,
    isOwner,
    profileUserId,
    companyId,
    projects: projectsFromParent,
    onRefresh,
    sectionClassName = '',
}) {
    const { t } = useTranslation('common');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(scope === 'profile');
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });
    const [viewModalProject, setViewModalProject] = useState(null);

    const loadProfileProjects = useCallback(async () => {
        if (!profileUserId) return;
        setLoading(true);
        try {
            const { data } = await profiles.getProjects({ user_id: profileUserId });
            setProjects(data.results || data || []);
        } catch (err) {
            console.error('Failed to load projects', err);
        } finally {
            setLoading(false);
        }
    }, [profileUserId]);

    useEffect(() => {
        if (scope === 'profile' && profileUserId) {
            loadProfileProjects();
        }
    }, [scope, profileUserId, loadProfileProjects]);

    useEffect(() => {
        if (scope === 'company') {
            setProjects(Array.isArray(projectsFromParent) ? projectsFromParent : []);
            setLoading(false);
        }
    }, [scope, projectsFromParent]);

    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const reloadAfterMutation = async () => {
        if (scope === 'company' && onRefresh) {
            await onRefresh();
        } else if (scope === 'profile') {
            await loadProfileProjects();
        }
    };

    const handleSaveItem = async (formData) => {
        const data = modalState.data;
        const isEdit = !!(data && data.id);
        if (scope === 'company' && companyId) {
            formData.append('company', String(companyId));
        }
        try {
            if (isEdit) {
                await profiles.updateProject(data.id, formData);
            } else {
                await profiles.addProject(formData);
            }
            await reloadAfterMutation();
            closeModal();
            toast.success(t('profile.toasts.availability_saved') || 'Saved successfully');
        } catch (err) {
            console.error(err);
            toast.error(t('profile.toasts.failed_update') || 'Failed to update');
            throw err;
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
                    await reloadAfterMutation();
                    toast.success(t('profile.toasts.deleted') || 'Deleted successfully');
                } catch (err) {
                    toast.error(t('profile.toasts.failed_delete') || 'Failed to delete');
                }
                setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>{t('common.loading')}</div>;
    }

    return (
        <div className={sectionClassName.trim()}>
            <div className={styles.sectionHeader}>
                <h2>{t('profile.tabs.projects')}</h2>
                {isOwner && (
                    <button type="button" className={styles.addBtn} onClick={() => openModal('project')}>
                        <span style={{ fontSize: '1.2rem' }}>+</span> {t('profile_modals.project.add_btn')}
                    </button>
                )}
            </div>

            {projects.length === 0 ? (
                <div className={styles.empty}>{t('profile_modals.project.no_projects')}</div>
            ) : (
                <div className={styles.projectsGrid}>
                    {projects.map((item) => (
                        <div
                            key={item.id}
                            className={styles.projectCard}
                            onClick={() => setViewModalProject(item)}
                            role="presentation"
                        >
                            {item.image ? (
                                <div className={styles.media}>
                                    {isOwner && (
                                        <div className={styles.cardActions}>
                                            <button
                                                type="button"
                                                title={t('profile_modals.project.edit') || 'Edit'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal('project', item);
                                                }}
                                            >
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.deleteBtn}
                                                title={t('profile.modals.delete_title') || 'Delete'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    )}
                                    <img src={item.image} alt="" className={styles.thumb} />
                                </div>
                            ) : null}
                            <div className={styles.cardBody}>
                                {isOwner && !item.image ? (
                                    <div className={styles.titleRow}>
                                        <h3 className={styles.cardTitle}>{item.title}</h3>
                                        <div className={styles.cardActionsBar}>
                                            <button
                                                type="button"
                                                title={t('profile_modals.project.edit') || 'Edit'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal('project', item);
                                                }}
                                            >
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.deleteBtn}
                                                title={t('profile.modals.delete_title') || 'Delete'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <h3>{item.title}</h3>
                                )}
                                <div className={styles.date}>{formatProjectDateForDisplay(item.date)}</div>
                                <p>{item.description}</p>
                                <div className={styles.readMore}>
                                    {t('profile_modals.project.read_more')} →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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

            {viewModalProject && (
                <Modal
                    isOpen={!!viewModalProject}
                    onClose={() => setViewModalProject(null)}
                    title={viewModalProject.title}
                    bodyStyle={{ padding: '20px' }}
                >
                    <div style={{ padding: '0 4px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
                            {t('profile_modals.project.date_label')}:{' '}
                            {formatProjectDateForDisplay(viewModalProject.date)}
                        </div>
                        <p style={{ color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: '0 0 16px' }}>
                            {viewModalProject.description}
                        </p>
                        {viewModalProject.image ? (
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <img
                                    src={viewModalProject.image}
                                    alt=""
                                    style={{
                                        maxWidth: 'min(100%, 420px)',
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: '280px',
                                        objectFit: 'contain',
                                        borderRadius: '12px',
                                        background: '#f3f4f6',
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            </div>
                        ) : null}
                        {viewModalProject.url ? (
                            <a
                                href={viewModalProject.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 18px',
                                    borderRadius: '10px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                }}
                            >
                                <ExternalLink size={18} />
                                {t('profile_modals.project.visit_link')}
                            </a>
                        ) : null}
                    </div>
                </Modal>
            )}
        </div>
    );
}
