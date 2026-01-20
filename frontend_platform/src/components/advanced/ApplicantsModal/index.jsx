import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import { User, Check, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ApplicantsModal.module.scss';
import { useTranslation } from '@/i18n/client';
import Link from 'next/link';

const ApplicantsModal = ({ isOpen, onClose, vacancyId }) => {
    const { t } = useTranslation('common');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedApp, setExpandedApp] = useState(null); // ID of expanded application (motivation letter)

    useEffect(() => {
        if (isOpen && vacancyId) {
            fetchApplicants();
        }
    }, [isOpen, vacancyId]);

    const fetchApplicants = async () => {
        setLoading(true);
        try {
            const res = await business.getVacancyApplicants(vacancyId);
            setApplicants(res.data);
        } catch (err) {
            console.error(err);
            toast.error(t('vacancy_detail.applicants_modal.failed_load'));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await business.updateApplicationStatus(appId, newStatus);
            toast.success(t('vacancy_detail.applicants_modal.app_status_update', { status: t(`vacancy_detail.applicants_modal.statuses.${newStatus}`) }));
            // Optimistic update
            setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        } catch (err) {
            console.error(err);
            toast.error(t('vacancy_detail.applicants_modal.failed_update'));
        }
    };

    const toggleMotivation = (id) => {
        setExpandedApp(expandedApp === id ? null : id);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return '#52c41a';
            case 'rejected': return '#f5222d';
            default: return '#faad14';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('vacancy_detail.applicants_modal.title')}>
            <div className={styles.container}>
                {loading ? (
                    <div className={styles.loading}>{t('vacancy_detail.applicants_modal.loading')}</div>
                ) : applicants.length === 0 ? (
                    <div className={styles.empty}>{t('vacancy_detail.applicants_modal.empty')}</div>
                ) : (
                    <div className={styles.list}>
                        {applicants.map(app => (
                            <div key={app.id} className={styles.item}>
                                <div className={styles.header}>
                                    <Link href={`/user/${app.applicant_details?.username}`} className={styles.userInfo} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                                        {app.applicant_details.avatar ? (
                                            <img src={app.applicant_details.avatar} alt="Avatar" className={styles.avatar} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}><User size={20} /></div>
                                        )}
                                        <div>
                                            <div className={styles.name}>{app.applicant_details.full_name}</div>
                                            <div className={styles.username}>@{app.applicant_details.username}</div>
                                        </div>
                                    </Link>
                                    <div className={styles.status} style={{ color: getStatusColor(app.status) }}>
                                        {t(`vacancy_detail.applicants_modal.statuses.${app.status}`)?.toUpperCase() || app.status?.toUpperCase()}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.motivationBtn} onClick={() => toggleMotivation(app.id)}>
                                        <FileText size={16} /> {t('vacancy_detail.applicants_modal.motivation_letter')} {expandedApp === app.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {app.status === 'pending' && (
                                        <div className={styles.decisionBtns}>
                                            <Button size="sm" onClick={() => handleStatusChange(app.id, 'accepted')} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                                                <Check size={16} /> {t('vacancy_detail.applicants_modal.accept')}
                                            </Button>
                                            <Button size="sm" type="default" onClick={() => handleStatusChange(app.id, 'rejected')} style={{ color: '#f5222d', borderColor: '#f5222d' }}>
                                                <X size={16} /> {t('vacancy_detail.applicants_modal.reject')}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {expandedApp === app.id && (
                                    <div className={styles.motivation}>
                                        {app.motivation_letter}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ApplicantsModal;
