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
                                overflow: 'hidden'
                            }} 
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}
                            onClick={() => openViewModal(item)}
                            >
                                <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.title}</h3>
                                </div>
                                
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
