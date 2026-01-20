
"use client";
import React, { useState, useEffect } from 'react';
import styles from './VacancyDetail.module.scss';
import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import ApplyModal from '@/components/advanced/ApplyModal';
import { notFound } from 'next/navigation';
import { MapPin, Briefcase, DollarSign, Clock, Building, Calendar, Share2, CheckCircle } from 'lucide-react';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslation } from '@/i18n/client';

export default function DetailClient({ vacancy }) {
    const { t, i18n } = useTranslation('common');
    const { user, login } = useAuth();
    const [isApplied, setIsApplied] = useState(vacancy.is_applied || false);
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        // If user is logged in, re-fetch vacancy to get accurate 'is_applied' status
        // because server-side render doesn't have user context.
        if (user && vacancy.slug) {
            business.getVacancy(vacancy.slug)
                .then(res => {
                    if (res.data.is_applied !== undefined) setIsApplied(res.data.is_applied);
                })
                .catch(err => console.error("Failed to refresh vacancy status", err));
        } else if (vacancy.is_applied !== undefined) {
            setIsApplied(vacancy.is_applied);
        }
    }, [user, vacancy.slug, vacancy.is_applied]);

    const handleApplyClick = () => {
        if (!user) {
            toast.info(t('vacancy_detail.toasts.login_apply'));
            login(); // Redirect or open login
            return;
        }
        setShowApplyModal(true);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success(t('vacancy_detail.toasts.link_copied'));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-US'));
    }

    // Helper to translate enums safely
    const translateEnum = (prefix, value) => {
        if (!value) return '';
        const key = value.replace('-', '_');
        return t(`${prefix}.${key}`, { defaultValue: value });
    };

    if (!vacancy) return null;

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.headerPanel}>
                <div className={styles.headerContent}>
                    <div className={styles.identity}>
                        {vacancy.company?.logo ? (
                            <img src={vacancy.company.logo} alt={vacancy.company.name} className={styles.logo} />
                        ) : (
                            <div className={styles.logoPlaceholder}>
                                {(vacancy.company_name || vacancy.company?.name || 'C').charAt(0)}
                            </div>
                        )}
                        <div className={styles.titleBlock}>
                            <h1 className={styles.title}>{vacancy.title}</h1>
                            <span className={styles.companyName}>{vacancy.company_name || vacancy.company?.name}</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {isApplied ? (
                            <Button variant="outline" className={styles.appliedBtn} disabled>
                                <CheckCircle size={18} /> {t('vacancy_detail.applied')}
                            </Button>
                        ) : (
                            <Button size="lg" onClick={handleApplyClick} className={styles.applyBtn}>
                                {t('vacancy_detail.apply_now')}
                            </Button>
                        )}

                        <button className={styles.shareBtn} onClick={handleShare}>
                            <Share2 size={18} />
                            <span>{t('vacancy_detail.share')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Main Content: Description */}
                <div className={styles.main}>
                    <div className={styles.section}>
                        <h2>{t('vacancy_detail.about')}</h2>

                        <div className={styles.datesRow}>
                            <div className={styles.dateItem}>
                                <span className={styles.dateLabel}>{t('vacancy_detail.posted_date')}:</span>
                                <span className={styles.dateValue}>{formatDate(vacancy.posted_at)}</span>
                            </div>
                            <div className={styles.dateItem}>
                                <span className={styles.dateLabel}>{t('vacancy_detail.deadline')}:</span>
                                <span className={styles.dateValue}>{formatDate(vacancy.expires_at)}</span>
                            </div>
                        </div>

                        <div className={styles.descriptionBlock}>
                            <h3>{t('vacancy_detail.description')}</h3>
                            <div className={styles.richText}>
                                {vacancy.description ? (
                                    <p>{vacancy.description}</p>
                                ) : (
                                    <p>{t('vacancy_detail.no_description')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional sections can go here */}

                    {/* Applicants Section (Visible only to owner) */}
                    {(vacancy.is_owner || (user && (user.id === vacancy.company?.owner || user.id === vacancy.posted_by))) && (
                        <ApplicantsList vacancyId={vacancy.id} />
                    )}
                </div>

                {/* Sidebar: Job Overview / Details */}
                <div className={styles.sidebar}>
                    <div className={styles.card}>
                        <h3>{t('vacancy_detail.overview')}</h3>
                        <ul className={styles.overviewList}>
                            <li>
                                <MapPin size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.location')}</span>
                                    <span className={styles.value}>{vacancy.location}</span>
                                </div>
                            </li>
                            <li>
                                <DollarSign size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.salary')}</span>
                                    <span className={styles.value}>{vacancy.salary_range || 'Competitive'}</span>
                                </div>
                            </li>
                            <li>
                                <Briefcase size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.job_type')}</span>
                                    <span className={styles.value}>{translateEnum('vacancies', vacancy.job_type)}</span>
                                </div>
                            </li>
                            <li>
                                <Clock size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.work_mode')}</span>
                                    <span className={styles.value}>{translateEnum('vacancies', vacancy.work_mode)}</span>
                                </div>
                            </li>
                            <li>
                                <Building size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.industry')}</span>
                                    <span className={styles.value}>{vacancy.sub_category?.name || 'Technology'}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <ApplyModal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                vacancyId={vacancy.id}
                onSuccess={() => {
                    setIsApplied(true);
                }}
            />
        </div>

    );
}

function ApplicantsList({ vacancyId }) {
    const { t, i18n } = useTranslation('common');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadApplicants();
    }, [vacancyId]);

    const loadApplicants = async () => {
        try {
            const res = await business.getVacancyApplicants(vacancyId);
            setApplicants(res.data);
        } catch (err) {
            console.error("Failed to load applicants", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await business.updateApplicationStatus(appId, newStatus);
            toast.success(t('vacancy_detail.toasts.status_updated', { status: newStatus }));
            // Optimistic update
            setApplicants(prev => prev.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error(t('vacancy_detail.toasts.update_failed'));
        }
    };

    if (loading) return <div className={styles.section} style={{ marginTop: 20 }}>{t('vacancy_detail.loading_applicants')}</div>;

    // Empty state
    if (applicants.length === 0) {
        return (
            <div className={styles.applicantsSection}>
                <h3>{t('vacancy_detail.applicants')}</h3>
                <div className={styles.emptyApplicants}>
                    <div className={styles.emptyIcon}>📂</div>
                    <p>{t('vacancy_detail.no_applicants')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.applicantsSection}>
            <h3>{t('vacancy_detail.applicants')} ({applicants.length})</h3>
            <div className={styles.applicantsList}>
                {applicants.map(app => (
                    <div key={app.id} className={styles.applicantCard}>
                        <div className={styles.applicantHeader}>
                            <div className={styles.applicantInfo}>
                                {app.applicant_avatar ? (
                                    <img src={app.applicant_avatar} alt="avatar" className={styles.avatarPlaceholder} style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {(app.applicant_first_name?.[0] || 'U')}
                                    </div>
                                )}
                                <div>
                                    <a href={`/user/${app.applicant_username}`} target="_blank" rel="noopener noreferrer" className={styles.applicantName}>
                                        {app.applicant_first_name} {app.applicant_last_name}
                                    </a>
                                    <span className={styles.username}>@{app.applicant_username}</span>
                                    <div className={styles.appliedDate}>{t('vacancy_detail.applied')} {new Date(app.created_at).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-US'))}</div>
                                </div>
                            </div>
                            <span className={`${styles.statusBadge} ${styles[app.status]}`}>
                                {app.status.toUpperCase()}
                            </span>
                        </div>

                        <div className={styles.motivationSection}>
                            <span className={styles.motivationLabel}>{t('vacancy_detail.motivation')}:</span>
                            <div className={styles.motivationContent}>
                                {app.motivation_letter}
                            </div>
                        </div>

                        {app.status === 'pending' && (
                            <div className={styles.applicantActions}>
                                <Button size="small" variant="outline" onClick={() => handleStatusChange(app.id, 'rejected')} className={styles.rejectBtn}>
                                    {t('vacancy_detail.reject')}
                                </Button>
                                <Button size="small" onClick={() => handleStatusChange(app.id, 'accepted')} className={styles.acceptBtn}>
                                    {t('vacancy_detail.accept')}
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
