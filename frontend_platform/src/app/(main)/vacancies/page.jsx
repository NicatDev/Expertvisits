"use client";
import React, { useState, useEffect } from 'react';
import { business } from '@/lib/api';
import VacancyCard from '@/components/advanced/VacancyCard';
import AddVacancyModal from '@/components/advanced/AddVacancyModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSelect from '@/components/ui/LocationSelect';
import { Search, Filter, Plus } from 'lucide-react';
import styles from './vacancies.module.scss';
import { useAuth } from '@/lib/contexts/AuthContext';
import Pagination from '@/components/ui/Pagination';
import { useTranslation } from '@/i18n/client';

export default function VacanciesPage() {
    const { t, ready } = useTranslation('common');

    // Prevent hydration mismatch by ensuring translations are loaded
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { user } = useAuth();
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [searchLocation, setSearchLocation] = useState(''); // New state
    const [jobType, setJobType] = useState('');
    const [workMode, setWorkMode] = useState('');
    const [page, setPage] = useState(1);

    const [showAddModal, setShowAddModal] = useState(false);

    const fetchVacancies = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                search,
                job_type: jobType || undefined,
                work_mode: workMode || undefined,
                location: searchLocation || undefined, // Use new state
            };
            const res = await business.getVacancies(params);
            setVacancies(res.data.results || res.data);
            setTotalCount(res.data.count || (res.data.results || res.data).length);
        } catch (err) {
            console.error("Failed to load vacancies", err);
        } finally {
            setLoading(false);
        }
    };


    // Debounced Search (only for text input)
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchVacancies();
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    // Immediate Filter Update (filters & pagination)
    useEffect(() => {
        fetchVacancies();
    }, [jobType, workMode, searchLocation, page]);

    if (!mounted) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>{t('vacancies.title')}</h1>
                    <p>{t('vacancies.subtitle')}</p>
                </div>
                {user && (
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> {t('vacancies.post_vacancy')}
                    </Button>
                )}
            </div>

            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={t('vacancies.search_placeholder')}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className={styles.searchInput}
                    />
                </div>

                <div style={{ width: '250px' }}>
                    <LocationSelect
                        value={searchLocation}
                        onChange={val => { setSearchLocation(val); setPage(1); }}
                        placeholder={t('vacancies.filter_city')}
                    />
                </div>

                <select
                    className={styles.filterSelect}
                    value={jobType}
                    onChange={e => { setJobType(e.target.value); setPage(1); }}
                >
                    <option value="">{t('vacancies.all_job_types')}</option>
                    <option value="full-time">{t('vacancies.full_time')}</option>
                    <option value="part-time">{t('vacancies.part_time')}</option>
                </select>

                <select
                    className={styles.filterSelect}
                    value={workMode}
                    onChange={e => { setWorkMode(e.target.value); setPage(1); }}
                >
                    <option value="">{t('vacancies.all_work_modes')}</option>
                    <option value="office">{t('vacancies.office')}</option>
                    <option value="remote">{t('vacancies.remote')}</option>
                    <option value="hybrid">{t('vacancies.hybrid')}</option>
                </select>
            </div>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>{t('vacancies.loading')}</div>
                ) : vacancies.length > 0 ? (
                    vacancies.map(v => (
                        <VacancyCard key={v.id} vacancy={v} />
                    ))
                ) : (
                    <div className={styles.empty}>{t('vacancies.empty')}</div>
                )}
            </div>



            <Pagination
                currentPage={page}
                totalCount={totalCount}
                pageSize={10}
                onPageChange={page => setPage(page)}
                alwaysShow={true}
            />

            <AddVacancyModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => { fetchVacancies(); setPage(1); }}
            />
        </div>
    );
}
