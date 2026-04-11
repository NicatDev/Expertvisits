"use client";
import React, { useState, useEffect } from 'react';
import { usePublicProfile } from '../context';
import { useTranslation } from '@/i18n/client';
import { profiles } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import NoContent from '@/components/ui/NoContent';
import styles from '../about.module.scss'; // Reuse styles

export default function UserServicesPage() {
    const { profile, loading } = usePublicProfile();
    const { t } = useTranslation('common');
    const [viewModalService, setViewModalService] = useState(null);

    const openViewModal = (service) => setViewModalService(service);
    const closeViewModal = () => setViewModalService(null);

    const [services, setServices] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (profile?.id) {
            loadServices(profile.id);
        }
    }, [profile]);

    const loadServices = async (userId) => {
        setLoadingDetails(true);
        try {
            const { data } = await profiles.getServices({ user_id: userId });
            setServices(data.results || data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    if (loading || loadingDetails) return <div style={{ padding: 20 }}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.section} style={{ padding: '0', background: 'transparent', border: 'none' }}>
                <div className={styles.sectionHeader} style={{ marginBottom: '20px', paddingBottom: '0', border: 'none' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>{t('profile.tabs.services') || 'Services'}</h2>
                </div>

                {services.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                        {t('profile.section_helper.no_items')}
                    </div>
                ) : (
                    <div className={styles.servicesGrid}>
                        {services.map(item => (
                            <div 
                                key={item.id} 
                                className={styles.serviceCard}
                                onClick={() => openViewModal(item)}
                            >
                                <div className={styles.cardHeader}>
                                    <h3>{item.title}</h3>
                                </div>
                                
                                <div className={styles.cardBody}>
                                    <p>{item.description}</p>
                                    
                                    <div className={styles.cardFooter}>
                                        <span className={styles.readMore}>
                                            {t('profile_modals.service.read_more') || 'Daha ətraflı'} <span>→</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
