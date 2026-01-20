import React from 'react';
import { useTranslation } from '@/i18n/client';
import styles from '../profile.module.scss';

const ApplicationsTab = ({ applications }) => {
    const { t } = useTranslation('common');

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>{t('profile.applications.title')}</h2>
            </div>
            <div className={styles.list}>
                {applications.length === 0 ? <p>{t('profile.applications.no_applications')}</p> : (
                    applications.map(app => (
                        <div key={app.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{app.vacancy_title}</h4>
                                <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>{app.company_name}</p>
                                <span style={{ fontSize: '12px', color: '#999' }}>{t('profile.applications.applied_on')} {new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                            <div style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                backgroundColor: app.status === 'accepted' ? '#f6ffed' : app.status === 'rejected' ? '#fff1f0' : '#fff7e6',
                                color: app.status === 'accepted' ? '#52c41a' : app.status === 'rejected' ? '#f5222d' : '#faad14',
                                border: `1px solid ${app.status === 'accepted' ? '#b7eb8f' : app.status === 'rejected' ? '#ffa39e' : '#ffe58f'}`
                            }}>
                                {app.status.toUpperCase()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ApplicationsTab;
