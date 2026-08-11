import React, { useState } from 'react';
import { MapPin, Clock, Briefcase, DollarSign, CheckCircle } from 'lucide-react';
import styles from './style.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import { useAuth } from '@/lib/contexts/AuthContext';
import { business } from '@/lib/api';
import Button from '@/components/ui/Button';
import ApplyModal from '@/components/advanced/ApplyModal';
import ApplicantsModal from '@/components/advanced/ApplicantsModal';
import { useTranslation } from '@/i18n/client';
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

const VacancyCard = ({ vacancy, isOwner, onEdit, onDelete }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname);
    const publisher = buildPublisher(vacancy);
    const vacancyHref = withLocale(pathLocale || defaultLocale, `/vacancies/${vacancy.slug}`);
    const companyHref = publisher?.slug
        ? withLocale(pathLocale || defaultLocale, `/companies/${publisher.slug}`)
        : null;
    const [hasJustApplied, setHasJustApplied] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showApplicantsModal, setShowApplicantsModal] = useState(false);
    const isExpired = isVacancyExpired(vacancy.expires_at);
    const isApplied = Boolean(vacancy.is_applied || hasJustApplied);
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
                    {publisher.logo ? (
                        <img src={publisher.logo} alt={publisher.name || ''} />
                    ) : (
                        <div className={styles.placeholderLogo}>{(publisher.name || 'C').charAt(0)}</div>
                    )}
                </div>
                <div className={styles.info}>
                    <Link href={vacancyHref} className={styles.title}>{vacancy.title}</Link>
                    {publisher.type === 'company' && publisher.slug && companyHref ? (
                        <Link href={companyHref} className={styles.companyName}>
                            {publisher.name}
                        </Link>
                    ) : (
                        <span className={styles.companyName}>{publisher.name}</span>
                    )}
                    {publisher.type === 'individual' ? (
                        <span className={styles.individualBadge}>{t('vacancy_detail.individual_posting_badge')}</span>
                    ) : null}
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
                <span className={`${styles.category} ${isExpired ? styles.inactiveCategory : ''}`}>
                    {isExpired ? t('vacancies.inactive') : (vacancy.sub_category?.name || t('vacancies.general'))}
                </span>

                {isOwner ? (
                    <div className={styles.ownerActions}>
                        <button className={styles.actionBtn} onClick={() => setShowApplicantsModal(true)}>{t('vacancy_detail.applicants')}</button>
                        {onEdit ? <button className={styles.actionBtn} onClick={onEdit}>{t('common.edit')}</button> : null}
                        {onDelete ? <button className={styles.deleteBtn} onClick={onDelete}>{t('common.delete')}</button> : null}
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
                onSuccess={() => setHasJustApplied(true)}
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
