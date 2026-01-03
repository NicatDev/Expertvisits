
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
                                <CheckCircle size={18} /> Applied
                            </Button>
                        ) : (
                            <Button size="lg" onClick={handleApplyClick} className={styles.applyBtn}>
                                Apply Now
                            </Button>
                        )}

                        <button className={styles.shareBtn} onClick={handleShare}>
                            <Share2 size={18} />
                            <span>Share this job</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Main Content: Description */}
                <div className={styles.main}>
                    <div className={styles.section}>
                        <h2>About the job</h2>

                        <div className={styles.datesRow}>
                            <div className={styles.dateItem}>
                                <span className={styles.dateLabel}>Posted Date:</span>
                                <span className={styles.dateValue}>{new Date(vacancy.posted_at).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.dateItem}>
                                <span className={styles.dateLabel}>Deadline:</span>
                                <span className={styles.dateValue}>{new Date(vacancy.expires_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className={styles.descriptionBlock}>
                            <h3>Description</h3>
                            <div className={styles.richText}>
                                {vacancy.description ? (
                                    <p>{vacancy.description}</p>
                                ) : (
                                    <p>No detailed description provided for this vacancy.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional sections can go here */}
                </div>

                {/* Sidebar: Job Overview / Details */}
                <div className={styles.sidebar}>
                    <div className={styles.card}>
                        <h3>Job Overview</h3>
                        <ul className={styles.overviewList}>
                            <li>
                                <MapPin size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Location</span>
                                    <span className={styles.value}>{vacancy.location}</span>
                                </div>
                            </li>
                            <li>
                                <DollarSign size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Salary</span>
                                    <span className={styles.value}>{vacancy.salary_range || 'Competitive'}</span>
                                </div>
                            </li>
                            <li>
                                <Briefcase size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Job Type</span>
                                    <span className={styles.value}>{vacancy.job_type}</span>
                                </div>
                            </li>
                            <li>
                                <Clock size={20} className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Work Mode</span>
                                    <span className={styles.value}>{vacancy.work_mode}</span>
                                </div>
                            </li>
                            <li>
                                <Building size={20} className={styles.icon} />
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
                }}
            />
        </div>
    );
}
