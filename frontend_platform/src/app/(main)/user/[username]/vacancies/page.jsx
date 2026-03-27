"use client";
import React, { useState, useEffect } from 'react';
import { usePublicProfile } from '../context';
import { business } from '@/lib/api';
import { useTranslation } from '@/i18n/client';
import VacancyCard from '@/components/advanced/VacancyCard';
import NoContent from '@/components/ui/NoContent';
import styles from './style.module.scss';

export default function UserVacanciesPage() {
    const { profile, loading: profileLoading } = usePublicProfile();
    const { t } = useTranslation('common');
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            loadVacancies(profile.id);
        }
    }, [profile]);

    const loadVacancies = async (userId) => {
        setLoading(true);
        try {
            const vacRes = await business.getVacancies({ company__owner: userId });
            setVacancies(vacRes.data.results || vacRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) return <div style={{ padding: 20 }}>Loading...</div>;
    if (!profile) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>{t('public_profile.tabs.vacancies')}</h3>
            </div>

            <div className={styles.list}>
                {vacancies.map(v => (
                    <VacancyCard key={v.id} vacancy={v} />
                ))}
                {vacancies.length === 0 && !loading && <NoContent message={t('public_profile.no_vacancies')} />}
            </div>
        </div>
    );
}
