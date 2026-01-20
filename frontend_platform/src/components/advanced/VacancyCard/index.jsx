import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Briefcase, DollarSign, CheckCircle } from 'lucide-react';
import styles from './VacancyCard.module.scss';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { business } from '@/lib/api';
import Button from '@/components/ui/Button';
import ApplyModal from '@/components/advanced/ApplyModal';
import ApplicantsModal from '@/components/advanced/ApplicantsModal';
import { useTranslation } from '@/i18n/client';

const VacancyCard = ({ vacancy, isOwner, onEdit, onDelete }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [isApplied, setIsApplied] = useState(vacancy.is_applied || false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showApplicantsModal, setShowApplicantsModal] = useState(false);

    // Update local state if prop changes (e.g. after list refresh)
    useEffect(() => {
        setIsApplied(vacancy.is_applied);
    }, [vacancy.is_applied]);
    // Helper to format date relative (e.g. 2 days ago)
    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        return "Just now";
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.companyLogo}>
                    {vacancy.company?.logo ? (
                        <img src={vacancy.company.logo} alt={vacancy.company.name} />
                    ) : (
                        <div className={styles.placeholderLogo}>{vacancy.company?.name?.[0]}</div>
                    )}
                </div>
                <div className={styles.info}>
                    <Link href={`/vacancies/${vacancy.slug}`} className={styles.title}>{vacancy.title}</Link>
                    <Link href={`/company/${vacancy.company?.slug}`} className={styles.companyName}>{vacancy.company?.name}</Link>
                </div>
                <div className={styles.typeBadge}>
                    {vacancy.job_type === 'full-time' ? t('vacancies.full_time') : t('vacancies.part_time')}
                </div>
            </div>

            <div className={styles.details}>
                <div className={styles.detailItem}>
                    <MapPin size={16} />
                    <span>{vacancy.location}</span>
                </div>
                <div className={styles.detailItem}>
                    <Briefcase size={16} />
                    <span>{vacancy.work_mode ? t(`vacancies.${vacancy.work_mode}`) : ''}</span>
                </div>
                <div className={styles.detailItem}>
                    <DollarSign size={16} />
                    <span>{vacancy.salary_range || 'Competitive'}</span>
                </div>
                <div className={styles.detailItem}>
                    <Clock size={16} />
                    <span>{timeAgo(vacancy.posted_at)}</span>
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.category}>{vacancy.sub_category?.name || 'General'}</span>

                {isOwner ? (
                    <div className={styles.ownerActions}>
                        <button className={styles.actionBtn} onClick={() => setShowApplicantsModal(true)}>{t('vacancy_detail.applicants')}</button>
                        <button className={styles.actionBtn} onClick={onEdit}>{t('common.edit')}</button>
                        <button className={styles.deleteBtn} onClick={onDelete}>{t('common.delete')}</button>
                    </div>
                ) : (
                    user ? (
                        isApplied ? (
                            <span className={styles.appliedBadge}><CheckCircle size={16} /> {t('vacancy_detail.applied')}</span>
                        ) : (
                            <Button size="small" onClick={() => setShowApplyModal(true)}>{t('vacancy_detail.apply_now')}</Button>
                        )
                    ) : (
                        <Link href="/login" className={styles.applyBtn}>{t('vacancy_detail.toasts.login_apply')}</Link>
                    )
                )}
            </div>

            <ApplyModal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                vacancyId={vacancy.id}
                vacancyTitle={vacancy.title}
                onSuccess={() => setIsApplied(true)}
            />

            <ApplicantsModal
                isOpen={showApplicantsModal}
                onClose={() => setShowApplicantsModal(false)}
                vacancyId={vacancy.id}
            />
        </div>
    );
};

export default VacancyCard;
