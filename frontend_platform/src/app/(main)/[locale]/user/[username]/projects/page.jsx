"use client";
import React, { useState, useEffect } from 'react';
import { usePublicProfile } from '../context';
import { useTranslation } from '@/i18n/client';
import { profiles } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import styles from '../UserAboutPageClient/style.module.scss';

export default function UserProjectsPage() {
    const { profile, loading } = usePublicProfile();
    const { t } = useTranslation('common');
    const [viewModalProject, setViewModalProject] = useState(null);

    const openViewModal = (project) => setViewModalProject(project);
    const closeViewModal = () => setViewModalProject(null);

    const [projects, setProjects] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (profile?.id) {
            loadProjects(profile.id);
        }
    }, [profile]);

    const loadProjects = async (userId) => {
        setLoadingDetails(true);
        try {
            const { data } = await profiles.getProjects({ user_id: userId });
            setProjects(data.results || data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    if (loading || loadingDetails) return <div style={{ padding: 20 }}>{t('common.loading') || 'Loading...'}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.section} style={{ padding: '0', background: 'transparent', border: 'none' }}>
                <div className={styles.sectionHeader} style={{ marginBottom: '20px', paddingBottom: '0', border: 'none' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {t('profile.tabs.projects')}
                    </h2>
                </div>

                {projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                        {t('profile_modals.project.no_projects')}
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
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>{t('profile_modals.project.no_image')}</div>
                                    )}
                                </div>
                                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#111827' }}>{item.title}</h3>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>{item.date}</div>
                                    <p style={{ color: '#4b5563', fontSize: '0.95rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.description}
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        <span style={{ color: '#2563eb', fontWeight: '500', fontSize: '0.9rem' }}>{t('profile_modals.project.read_more')} →</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail View Modal */}
            {viewModalProject && (
                <Modal isOpen={!!viewModalProject} onClose={closeViewModal} title={viewModalProject.title} bodyStyle={{ padding: '20px' }}>
                    {viewModalProject.image && (
                        <div style={{ width: '100%', maxHeight: '400px', overflow: 'hidden', background: '#f3f4f6', borderRadius: '12px', marginBottom: '20px' }}>
                            <img src={viewModalProject.image} alt={viewModalProject.title} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        </div>
                    )}
                    <div style={{ padding: '0 4px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>{t('profile_modals.project.date_label')}: {viewModalProject.date}</div>
                        <p style={{ color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{viewModalProject.description}</p>
                    </div>
                </Modal>
            )}
        </div>
    );
}
