"use client";
import React, { useState, useEffect } from 'react';
import { usePublicProfile } from '../context';
import { profiles } from '@/lib/api';
import { useTranslation } from '@/i18n/client';
import NoContent from '@/components/ui/NoContent';
import OpenToWork from '../../../profile/components/OpenToWork';
import ProfileSummary from '../../../profile/components/ProfileSummary';
import styles from './style.module.scss';
import ExperienceDisplay from '@/components/profile/ExperienceDisplay';
import { labelForSubCategory } from '@/lib/utils/subcategory';

export default function UserAboutPage() {
    const { profile, loading: profileLoading, isMe } = usePublicProfile();
    const { t, i18n } = useTranslation('common');

    const professionLabel = labelForSubCategory(profile?.profession_sub_category, i18n.language);

    const [experiences, setExperiences] = useState([]);
    const [educations, setEducations] = useState([]);
    const [skills, setSkills] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (profile?.id) {
            loadDetails(profile.id);
        }
    }, [profile]);

    const loadDetails = async (userId) => {
        setLoadingDetails(true);
        try {
            const fetchConfig = { user_id: userId };
            const [exp, edu, ski, lan, cert] = await Promise.all([
                profiles.getExperience(fetchConfig),
                profiles.getEducation(fetchConfig),
                profiles.getSkills(fetchConfig),
                profiles.getLanguages(fetchConfig),
                profiles.getCertificates(fetchConfig),
            ]);

            setExperiences(exp.data.results || exp.data || []);
            setEducations(edu.data.results || edu.data || []);
            setSkills(ski.data.results || ski.data || []);
            setLanguages(lan.data.results || lan.data || []);
            setCertificates(cert.data.results || cert.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    if (profileLoading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>;
    if (!profile) return null;

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <OpenToWork user={profile} isEditable={false} />

                <ProfileSummary profile={profile} isOwner={false} onSave={() => {}} />

                {/* Info with Birthday */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>{t('profile.personal_info')}</h2>
                    </div>
                    <div className={styles.list}>
                        {['first_name', 'last_name', 'username', 'email', 'phone_number', 'birth_day', 'city']
                            .filter(field => field !== 'phone_number' || profile.show_phone_number || isMe)
                            .map(field => (
                                <div key={field} className={styles.editableField}>
                                    <span className={styles.label}>{t(`profile.${field}`) || field.replace('_', ' ')}</span>
                                    <div className={styles.value}>
                                        <span style={{ color: profile[field] ? '#333' : '#999' }}>
                                            {profile[field] || t('profile.not_set')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        <div className={styles.editableField}>
                            <span className={styles.label}>{t('profile.profession')}</span>
                            <div className={styles.value}>
                                <span style={{ color: professionLabel ? '#333' : '#999' }}>
                                    {professionLabel || t('profile.not_set')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <Section title={t('profile.sections.experience')} items={experiences} renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <ExperienceDisplay item={item} t={t} variant="public" />
                    </div>
                )} t={t} />

                <Section title={t('profile.sections.education')} items={educations} renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.institution}</h3>
                        <p>{item.degree_type_display || item.degree_type} in {item.field_of_study}</p>
                        <span>{item.start_date} - {item.end_date || t('common.present')}</span>
                    </div>
                )} t={t} />

                <div className={styles.skillsGrid}>
                    <Section 
                        title={t('profile.sections.hard_skills')} 
                        items={skills.filter(s => s.skill_type === 'hard')} 
                        layout="compact"
                        renderItem={(item) => (
                            <div className={styles.skillBadge}>
                                {item.name}
                            </div>
                        )} t={t} 
                    />

                    <Section 
                        title={t('profile.sections.soft_skills')} 
                        items={skills.filter(s => s.skill_type === 'soft')} 
                        layout="compact"
                        renderItem={(item) => (
                            <div className={styles.skillBadge}>
                                {item.name}
                            </div>
                        )} t={t} 
                    />
                </div>

                <Section title={t('profile.sections.languages')} items={languages} renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                        <span>{t('profile.level')}: {item.level.toUpperCase()}</span>
                    </div>
                )} t={t} />

                <Section title={t('profile.sections.certificates')} items={certificates} renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                        <p>{item.issuing_organization}</p>
                        <span>{item.issue_date}</span>
                    </div>
                )} t={t} />

            </div>
        </div>
    );
}

const Section = ({ title, items, renderItem, t, layout = 'list' }) => {
    const isCompact = layout === 'compact';
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>{title}</h2>
            </div>
            <div className={`${styles.list} ${isCompact ? styles.compactList : ''}`}>
                {items.map(item => (
                    <div key={item.id} className={`${styles.listItem} ${isCompact ? styles.compactItem : ''}`}>
                        {renderItem(item)}
                    </div>
                ))}
                {items.length === 0 && <NoContent message={t('profile.section_helper.no_items')} size="small" />}
            </div>
        </div>
    );
};
