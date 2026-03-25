"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useProfile } from '../context';
import { profiles } from '@/lib/api';
import Section from '../components/Section';
import styles from '../profile.module.scss';
import { ServiceModal } from '@/components/advanced/ProfileModals';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from 'react-toastify';
import Modal from '@/components/ui/Modal';

export default function ServicesPage() {
    const { t } = useTranslation('common');
    const { profile, loading: profileLoading, isOwner } = useProfile();
    const [services, setServices] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(true);
    
    // Manage adding/editing from Section component
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Manage simply viewing service details
    const [viewModalService, setViewModalService] = useState(null);

    useEffect(() => {
        if (profile?.id) {
            loadServices();
        }
    }, [profile]);

    const loadServices = async () => {
        try {
            const { data } = await profiles.getProfileDetails(profile.id);
            setServices(data.services || []);
        } catch (err) {
            console.error("Failed to load services", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const openViewModal = (service) => {
        // Stop bubbling if edit buttons were clicked? The section component handles item rendering, so we wrap the item and onClick.
        setViewModalService(service);
    };

    const closeViewModal = () => setViewModalService(null);

    const handleSaveItem = async (formData) => {
        const { data } = modalState;
        const isEdit = !!(data && data.id);

        try {
            if (isEdit) await profiles.updateService(data.id, formData);
            else await profiles.addService(formData);
            
            loadServices();
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
                    await profiles.deleteService(id);
                    loadServices();
                    toast.success(t('profile.toasts.deleted') || 'Deleted successfully');
                } catch (err) {
                    console.error(err);
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {t('profile.tabs.services') || 'Services'}
                    </h2>
                    {isOwner && (
                        <button onClick={() => openModal('service')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }}>
                            <span style={{ fontSize: '1.2rem' }}>+</span> {t('profile_modals.service.add') || 'Add'}
                        </button>
                    )}
                </div>

                {services.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                        {t('profile.section_helper.no_items')}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {services.map(item => (
                            <div key={item.id} style={{
                                background: 'white', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                overflow: 'hidden'
                            }} 
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}
                            onClick={() => openViewModal(item)}
                            >
                                <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', paddingRight: isOwner ? '60px' : '0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.title}</h3>
                                </div>
                                
                                {isOwner && (
                                    <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', gap: '8px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); openModal('service', item); }} style={{ background: '#e0f2fe', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#0284c7' }}>✎</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: '#fee2e2', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }}>✖</button>
                                    </div>
                                )}
                                
                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <p style={{ margin: '0 0 20px 0', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                        {item.description}
                                    </p>
                                    
                                    <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto' }}>
                                        <span style={{ color: '#2563eb', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {t('profile_modals.service.read_more') || 'Daha ətraflı'} <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>→</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ServiceModal 
                isOpen={modalState.type === 'service'} 
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

            {/* View Modal for Service Steps */}
            {viewModalService && (
                <Modal isOpen={!!viewModalService} onClose={closeViewModal} title={viewModalService.title}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                        <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{viewModalService.description}</p>
                        
                        {viewModalService.steps && viewModalService.steps.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>{t('profile_modals.service.steps') || 'Steps'}:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {viewModalService.steps.map((step, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                                            <div style={{ 
                                                width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: 'white', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ color: '#374151', lineHeight: '1.5', paddingTop: '2px' }}>
                                                {step}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
