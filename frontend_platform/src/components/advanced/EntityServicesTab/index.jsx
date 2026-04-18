"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n/client';
import { profiles } from '@/lib/api';
import { ServiceModal } from '@/components/advanced/ProfileModals';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

/**
 * Profile or company services — same UI as /profile/services.
 * Parent passes isOwner (user owner or company owner).
 *
 * @param {'profile'|'company'} scope
 * @param {boolean} isOwner
 * @param {number} [profileUserId] — scope profile
 * @param {number} [companyId] — scope company
 * @param {Array} [services] — scope company: from API (company.services)
 * @param {() => Promise<void>} [onRefresh] — scope company: e.g. loadCompany
 */
export default function EntityServicesTab({
    scope,
    isOwner,
    profileUserId,
    companyId,
    services: servicesFromParent,
    onRefresh,
    sectionClassName = '',
}) {
    const { t } = useTranslation('common');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(scope === 'profile');
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });
    const [viewModalService, setViewModalService] = useState(null);

    const loadProfileServices = useCallback(async () => {
        if (!profileUserId) return;
        setLoading(true);
        try {
            const { data } = await profiles.getProfileDetails(profileUserId);
            setServices(data.services || []);
        } catch (err) {
            console.error('Failed to load services', err);
        } finally {
            setLoading(false);
        }
    }, [profileUserId]);

    useEffect(() => {
        if (scope === 'profile' && profileUserId) {
            loadProfileServices();
        }
    }, [scope, profileUserId, loadProfileServices]);

    useEffect(() => {
        if (scope === 'company') {
            setServices(Array.isArray(servicesFromParent) ? servicesFromParent : []);
            setLoading(false);
        }
    }, [scope, servicesFromParent]);

    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const reloadAfterMutation = async () => {
        if (scope === 'company' && onRefresh) {
            await onRefresh();
        } else if (scope === 'profile') {
            await loadProfileServices();
        }
    };

    const handleSaveItem = async (formData) => {
        const data = modalState.data;
        const isEdit = !!(data && data.id);
        const payload = { ...formData };
        if (scope === 'company' && companyId && !isEdit) {
            payload.company = companyId;
        }

        try {
            if (isEdit) await profiles.updateService(data.id, payload);
            else await profiles.addService(payload);

            await reloadAfterMutation();
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
                    await reloadAfterMutation();
                    toast.success(t('profile.toasts.deleted') || 'Deleted successfully');
                } catch (err) {
                    console.error(err);
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
                <h2>{t('profile.tabs.services') || 'Services'}</h2>
                {isOwner && (
                    <button type="button" className={styles.addBtn} onClick={() => openModal('service')}>
                        <span style={{ fontSize: '1.2rem' }}>+</span>{' '}
                        {t('profile_modals.service.add') || 'Add'}
                    </button>
                )}
            </div>

            {services.length === 0 ? (
                <div className={styles.empty}>{t('profile.section_helper.no_items')}</div>
            ) : (
                <div className={styles.servicesGrid}>
                    {services.map((item) => (
                        <div
                            key={item.id}
                            className={styles.serviceCard}
                            onClick={() => setViewModalService(item)}
                            role="presentation"
                        >
                            <div className={styles.cardHeader}>
                                <h3>{item.title}</h3>
                                {isOwner && (
                                    <div className={styles.cardActions}>
                                        <button
                                            type="button"
                                            className={styles.editBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openModal('service', item);
                                            }}
                                        >
                                            ✎
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.deleteBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.id);
                                            }}
                                        >
                                            ✖
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardBody}>
                                <p>{item.description}</p>
                                <div className={styles.cardFooter}>
                                    <span className={styles.readMore}>
                                        {t('profile_modals.service.read_more') || 'Read more'}{' '}
                                        <span>→</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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

            {viewModalService && (
                <Modal isOpen={!!viewModalService} onClose={() => setViewModalService(null)} title={viewModalService.title}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                        <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{viewModalService.description}</p>

                        {viewModalService.steps && viewModalService.steps.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <h4 style={{ marginBottom: '12px', color: '#1f2937' }}>
                                    {t('profile_modals.service.steps') || 'Steps'}:
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {viewModalService.steps.map((step, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                gap: '12px',
                                                alignItems: 'flex-start',
                                                background: '#f9fafb',
                                                padding: '12px',
                                                borderRadius: '8px',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {idx + 1}
                                            </div>
                                            <div style={{ color: '#374151', lineHeight: '1.5', paddingTop: '2px' }}>{step}</div>
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
