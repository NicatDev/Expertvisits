
"use client";
import React, { useCallback, useState, useEffect } from 'react';
import styles from './style.module.scss';
import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import ApplyModal from '@/components/advanced/ApplyModal';
import AddVacancyModal from '@/components/advanced/AddVacancyModal';
import ApplicationDecisionModal from '@/components/advanced/ApplicationDecisionModal';
import { MapPin, Briefcase, DollarSign, Clock, Share2, CheckCircle, Phone, Mail, Globe, ExternalLink, Pencil, Send } from 'lucide-react';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslation } from '@/i18n/client';
import { usePathname } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import { isVacancyExpired } from '@/lib/utils/vacancy';

function buildPublisher(vacancy) {
    if (vacancy.publisher) return vacancy.publisher;
    if (vacancy.company) {
        return {
            type: 'company',
            name: vacancy.company.name,
            slug: vacancy.company.slug,
            logo: vacancy.company.logo,
            email: vacancy.show_contact_email ? vacancy.company.email : '',
            phone: vacancy.show_contact_phone ? vacancy.company.phone : '',
            website_url: vacancy.company.website_url,
        };
    }
    return {
        type: 'individual',
        name: vacancy.company_name || vacancy.employer_display_name || '',
        slug: null,
        logo: vacancy.employer_logo,
        email: vacancy.show_contact_email ? vacancy.employer_email : '',
        phone: vacancy.show_contact_phone ? vacancy.employer_phone : '',
        website_url: vacancy.employer_website,
    };
}

export default function DetailClient({ vacancy }) {
    const { t, i18n } = useTranslation('common');
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname);
    const uiLocale = pathLocale || defaultLocale;
    const userPublicHref = (username) =>
        username ? withLocale(uiLocale, `/user/${encodeURIComponent(username)}`) : '#';
    const { user, login } = useAuth();
    const [vacancyData, setVacancyData] = useState(vacancy);
    const [isApplied, setIsApplied] = useState(vacancy.is_applied || false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (!user || !vacancy.slug) return;
        business.getVacancy(vacancy.slug)
            .then(res => {
                setVacancyData(res.data);
                if (res.data.is_applied !== undefined) setIsApplied(res.data.is_applied);
            })
            .catch(err => console.error("Failed to refresh vacancy status", err));
    }, [user, vacancy.slug]);

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

    const refreshVacancy = async () => {
        const res = await business.getVacancy(vacancyData.slug || vacancy.slug);
        setVacancyData(res.data);
        if (res.data.is_applied !== undefined) setIsApplied(res.data.is_applied);
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

    const publisher = buildPublisher(vacancyData);
    const companyPageHref = publisher?.slug ? withLocale(uiLocale, `/companies/${publisher.slug}`) : null;
    const displayName = publisher.name || vacancyData.company_name || '';
    const isOwner = Boolean(vacancyData.is_owner);
    const isExpired = isVacancyExpired(vacancyData.expires_at);

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.headerPanel}>
                <div className={styles.headerContent}>
                    <div className={styles.identity}>
                        {publisher.logo ? (
                            <img src={publisher.logo} alt={displayName} className={styles.logo} />
                        ) : (
                            <div className={styles.logoPlaceholder}>
                                {(displayName || 'C').charAt(0)}
                            </div>
                        )}
                        <div className={styles.titleBlock}>
                            <h1 className={styles.title}>{vacancyData.title}</h1>
                            <div className={styles.employerRow}>
                                {publisher.type === 'company' && publisher.slug && companyPageHref ? (
                                    <a href={companyPageHref} className={styles.companyName}>
                                        {displayName}
                                    </a>
                                ) : (
                                    <span className={styles.companyName}>{displayName}</span>
                                )}
                                {publisher.type === 'individual' ? (
                                    <span className={styles.individualBadge}>{t('vacancy_detail.individual_posting_badge')}</span>
                                ) : null}
                                {isExpired ? (
                                    <span className={styles.inactiveBadge}>{t('vacancies.inactive')}</span>
                                ) : null}
                            </div>
                            {publisher.type === 'company' && publisher.slug && companyPageHref ? (
                                <a href={companyPageHref} className={styles.companyPageLink}>
                                    <ExternalLink size={14} /> {t('vacancy_detail.view_company_profile')}
                                </a>
                            ) : null}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {isOwner ? (
                            <Button variant="outline" className={styles.editBtn} onClick={() => setShowEditModal(true)}>
                                <Pencil size={18} /> {t('vacancy_detail.edit_vacancy')}
                            </Button>
                        ) : isApplied ? (
                            <Button variant="outline" className={styles.appliedBtn} disabled>
                                <CheckCircle size={18} /> {t('vacancy_detail.applied')}
                            </Button>
                        ) : (
                            <Button size="large" onClick={handleApplyClick} className={styles.applyBtn}>
                                <Send size={18} />
                                <span>{t('vacancy_detail.apply_now')}</span>
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
                                <span className={styles.dateValue} suppressHydrationWarning>{formatDate(vacancyData.posted_at)}</span>
                            </div>
                            <div className={styles.dateItem}>
                                <span className={styles.dateLabel}>{t('vacancy_detail.deadline')}:</span>
                                <span className={styles.dateValue} suppressHydrationWarning>{formatDate(vacancyData.expires_at)}</span>
                            </div>
                        </div>

                        <div
                            className={styles.descriptionBlock}
                            lang={vacancyData.language || undefined}
                        >
                            <h3>{t('vacancy_detail.description')}</h3>
                            <div className={styles.richText}>
                                {vacancyData.description ? (
                                    <p>{vacancyData.description}</p>
                                ) : (
                                    <p>{t('vacancy_detail.no_description')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional sections can go here */}

                    {/* Applicants Section (Visible only to owner) */}
                    {isOwner && <ApplicantsList vacancyId={vacancyData.id} userPublicHref={userPublicHref} />}
                </div>

                {/* Sidebar: Job Overview / Details */}
                <div className={styles.sidebar}>
                    <div className={styles.card}>
                        <h2>{t('vacancy_detail.overview')}</h2>
                        <ul className={styles.overviewList}>
                            <li>
                                <MapPin size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.location')}</span>
                                    <span className={styles.value}>{vacancyData.location}</span>
                                </div>
                            </li>
                            <li>
                                <DollarSign size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.salary')}</span>
                                    <span className={styles.value}>{vacancyData.salary_range || 'Competitive'}</span>
                                </div>
                            </li>
                            <li>
                                <Briefcase size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.job_type')}</span>
                                    <span className={styles.value}>{translateEnum('vacancies', vacancyData.job_type)}</span>
                                </div>
                            </li>
                            <li>
                                <Clock size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>{t('vacancy_detail.work_mode')}</span>
                                    <span className={styles.value}>{translateEnum('vacancies', vacancyData.work_mode)}</span>
                                </div>
                            </li>
                          
                        </ul>
                    </div>

                    {(publisher.phone || publisher.email || publisher.website_url) ? (
                        <div className={`${styles.card} ${styles.contactCard}`}>
                            <h2>{t('vacancy_detail.contact')}</h2>
                            <ul className={styles.overviewList}>
                                {publisher.phone ? (
                                    <li>
                                        <Phone size={20} className={styles.icon} />
                                        <div>
                                            <span className={styles.label}>{t('vacancy_detail.contact_phone_label')}</span>
                                            <a href={`tel:${publisher.phone}`} className={styles.valueLink}>{publisher.phone}</a>
                                        </div>
                                    </li>
                                ) : null}
                                {publisher.email ? (
                                    <li>
                                        <Mail size={20} className={styles.icon} />
                                        <div>
                                            <span className={styles.label}>{t('vacancy_detail.contact_email_label')}</span>
                                            <a href={`mailto:${publisher.email}`} className={styles.valueLink}>{publisher.email}</a>
                                        </div>
                                    </li>
                                ) : null}
                                {publisher.website_url ? (
                                    <li>
                                        <Globe size={20} className={styles.icon} />
                                        <div>
                                            <span className={styles.label}>{t('vacancy_detail.contact_website_label')}</span>
                                            <a href={publisher.website_url} target="_blank" rel="noopener noreferrer" className={styles.valueLink}>
                                                {publisher.website_url.replace(/^https?:\/\//, '')}
                                            </a>
                                        </div>
                                    </li>
                                ) : null}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </div>

            <ApplyModal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                vacancyId={vacancyData.id}
                vacancyTitle={vacancyData.title}
                onSuccess={() => {
                    setIsApplied(true);
                }}
            />
            <AddVacancyModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                initialData={vacancyData}
                onSuccess={async () => {
                    setShowEditModal(false);
                    await refreshVacancy();
                }}
            />
        </div>

    );
}

function ApplicantsList({ vacancyId, userPublicHref }) {
    const { t, i18n } = useTranslation('common');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [decision, setDecision] = useState(null);
    const [decisionLoading, setDecisionLoading] = useState(false);

    const loadApplicants = useCallback(async () => {
        try {
            const res = await business.getVacancyApplicants(vacancyId);
            setApplicants(res.data);
        } catch (err) {
            console.error("Failed to load applicants", err);
        } finally {
            setLoading(false);
        }
    }, [vacancyId]);

    useEffect(() => {
        loadApplicants();
    }, [loadApplicants]);

    const handleStatusChange = async (responseMessage) => {
        if (!decision) return;
        const { app, status } = decision;
        setDecisionLoading(true);
        try {
            await business.updateApplicationStatus(app.id, status, responseMessage);
            toast.success(t('vacancy_detail.toasts.status_updated', { status: t(`vacancy_detail.applicants_modal.statuses.${status}`) }));
            setApplicants(prev => prev.map(app =>
                app.id === decision.app.id ? { ...app, status, response_message: responseMessage } : app
            ));
            setDecision(null);
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error(t('vacancy_detail.toasts.update_failed'));
        } finally {
            setDecisionLoading(false);
        }
    };

    if (loading) return <div className={styles.section} style={{ marginTop: 20 }}>{t('vacancy_detail.loading_applicants')}</div>;

    // Empty state
    if (applicants.length === 0) {
        return (
            <div className={styles.applicantsSection}>
                <h2>{t('vacancy_detail.applicants')}</h2>
                <div className={styles.emptyApplicants}>
                    <div className={styles.emptyIcon}>📂</div>
                    <p>{t('vacancy_detail.no_applicants')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.applicantsSection}>
            <h2>{t('vacancy_detail.applicants')} ({applicants.length})</h2>
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
                                    <a href={userPublicHref(app.applicant_username)} target="_blank" rel="noopener noreferrer" className={styles.applicantName}>
                                        {(app.applicant_first_name || app.applicant_details?.full_name || '').trim() || app.applicant_username || t('vacancy_detail.applicant_fallback')}
                                    </a>
                                    {app.applicant_username ? (
                                        <a href={userPublicHref(app.applicant_username)} target="_blank" rel="noopener noreferrer" className={styles.username}>
                                            @{app.applicant_username}
                                        </a>
                                    ) : null}
                                    <div className={styles.appliedDate} suppressHydrationWarning>{t('vacancy_detail.applied')} {new Date(app.created_at).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-US'))}</div>
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

                        {app.response_message ? (
                            <div className={styles.responseSection}>
                                <span className={styles.motivationLabel}>{t('vacancy_detail.response_reason')}:</span>
                                <div className={styles.motivationContent}>
                                    {app.response_message}
                                </div>
                            </div>
                        ) : null}

                        {app.status === 'pending' && (
                            <div className={styles.applicantActions}>
                                <Button size="small" variant="outline" onClick={() => setDecision({ app, status: 'rejected' })} className={styles.rejectBtn}>
                                    {t('vacancy_detail.reject')}
                                </Button>
                                <Button size="small" onClick={() => setDecision({ app, status: 'accepted' })} className={styles.acceptBtn}>
                                    {t('vacancy_detail.accept')}
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <ApplicationDecisionModal
                key={decision ? `${decision.app.id}-${decision.status}` : 'closed'}
                isOpen={Boolean(decision)}
                status={decision?.status}
                applicantName={(decision?.app?.applicant_first_name || decision?.app?.applicant_details?.full_name || '').trim() || decision?.app?.applicant_username}
                onClose={() => setDecision(null)}
                onConfirm={handleStatusChange}
                loading={decisionLoading}
            />
        </div>
    );
}
