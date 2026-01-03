
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

export default function DetailClient({ vacancy }) {
    const { user, login } = useAuth();
    const [isApplied, setIsApplied] = useState(vacancy.is_applied || false);
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        if (vacancy.is_applied !== undefined) {
            setIsApplied(vacancy.is_applied);
        }
    }, [vacancy.is_applied]);

    const handleApplyClick = () => {
        if (!user) {
            toast.info("Please login to apply");
            login(); // Redirect or open login
            return;
        }
        setShowApplyModal(true);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    if (!vacancy) return null;

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.companyInfo}>
                        {vacancy.company?.logo ? (
                            <img src={vacancy.company.logo} alt={vacancy.company.name} className={styles.logo} />
                        ) : (
                            <div className={styles.logoPlaceholder}>
                                {(vacancy.company_name || vacancy.company?.name || 'C').charAt(0)}
                            </div>
                        )}
                        <span className={styles.companyName}>{vacancy.company_name || vacancy.company?.name}</span>
                    </div>
                    <h1 className={styles.title}>{vacancy.title}</h1>

                    <div className={styles.heroMeta}>
                        <div className={styles.metaItem}>
                            <MapPin size={18} />
                            {vacancy.location}
                        </div>
                        <div className={styles.metaItem}>
                            <Briefcase size={18} />
                            {vacancy.job_type}
                        </div>
                        <div className={styles.metaItem}>
                            <Clock size={18} />
                            {vacancy.work_mode}
                        </div>
                        <div className={styles.metaItem}>
                            <DollarSign size={18} />
                            {vacancy.salary_range || 'Competitive Salary'}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {isApplied ? (
                            <Button variant="outline" className={styles.appliedBtn} disabled>
                                <CheckCircle size={18} /> Applied
                            </Button>
                        ) : (
                            <Button size="lg" onClick={handleApplyClick}>
                                Apply Now
                            </Button>
                        )}
                        <button className={styles.shareBtn} onClick={handleShare}>
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Main Content */}
                <div className={styles.main}>
                    <div className={styles.section}>
                        <h2>Description</h2>
                        <div className={styles.richText}>
                            {vacancy.description ? (
                                <p>{vacancy.description}</p>
                            ) : (
                                <p>No detailed description provided for this vacancy.</p>
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2>Requirements & Responsibilities</h2>
                        <p>
                            {/* Placeholder as these fields aren't separate yet */}
                            Detailed requirements would go here. For now, please refer to the description above.
                        </p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.card}>
                        <h3>Job Overview</h3>
                        <ul className={styles.overviewList}>
                            <li>
                                <Calendar size={18} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Posted</span>
                                    <span className={styles.value}>{new Date(vacancy.posted_at).toLocaleDateString()}</span>
                                </div>
                            </li>
                            <li>
                                <Clock size={18} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Expires</span>
                                    <span className={styles.value}>{new Date(vacancy.expires_at).toLocaleDateString()}</span>
                                </div>
                            </li>
                            <li>
                                <Building size={18} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Industry</span>
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
                    toast.success("Application submitted successfully!");
                }}
            />
        </div>
    );
}
