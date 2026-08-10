'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import { User, Check, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import ApplicationDecisionModal from '@/components/advanced/ApplicationDecisionModal';

const ApplicantsModal = ({ isOpen, onClose, vacancyId }) => {
    const { t } = useTranslation('common');
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname) || defaultLocale;
    const userPublicHref = (u) => (u ? withLocale(pathLocale, `/user/${encodeURIComponent(u)}`) : '#');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedApp, setExpandedApp] = useState(null); // ID of expanded application (motivation letter)
    const [decision, setDecision] = useState(null);
    const [decisionLoading, setDecisionLoading] = useState(false);

    const fetchApplicants = useCallback(async () => {
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
    }, [t, vacancyId]);

    useEffect(() => {
        if (isOpen && vacancyId) {
            fetchApplicants();
        }
    }, [fetchApplicants, isOpen, vacancyId]);

    const handleStatusChange = async (responseMessage) => {
        if (!decision) return;
        const { app, status } = decision;
        setDecisionLoading(true);
        try {
            await business.updateApplicationStatus(app.id, status, responseMessage);
            toast.success(t('vacancy_detail.applicants_modal.app_status_update', { status: t(`vacancy_detail.applicants_modal.statuses.${status}`) }));
            setApplicants(prev => prev.map(a => a.id === app.id ? { ...a, status, response_message: responseMessage } : a));
            setDecision(null);
        } catch (err) {
            console.error(err);
            toast.error(t('vacancy_detail.applicants_modal.failed_update'));
        } finally {
            setDecisionLoading(false);
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
                                    <Link href={userPublicHref(app.applicant_details?.username)} className={styles.userInfo} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
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
                                            <Button size="small" onClick={() => setDecision({ app, status: 'accepted' })} className={styles.acceptDecisionBtn}>
                                                <Check size={16} /> {t('vacancy_detail.applicants_modal.accept')}
                                            </Button>
                                            <Button size="small" type="default" onClick={() => setDecision({ app, status: 'rejected' })} className={styles.rejectDecisionBtn}>
                                                <X size={16} /> {t('vacancy_detail.applicants_modal.reject')}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {app.response_message ? (
                                    <div className={styles.responseMessage}>
                                        <span className={styles.responseLabel}>{t('vacancy_detail.response_reason')}</span>
                                        <p>{app.response_message}</p>
                                    </div>
                                ) : null}

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
            <ApplicationDecisionModal
                key={decision ? `${decision.app.id}-${decision.status}` : 'closed'}
                isOpen={Boolean(decision)}
                status={decision?.status}
                applicantName={decision?.app?.applicant_details?.full_name || decision?.app?.applicant_details?.username}
                onClose={() => setDecision(null)}
                onConfirm={handleStatusChange}
                loading={decisionLoading}
            />
        </Modal>
    );
};

export default ApplicantsModal;
