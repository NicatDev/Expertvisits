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

export default function VacanciesPage() {
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Vacancies</h1>
                    <p>Find your dream job or internship</p>
                </div>
                {user && (
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Post Vacancy
                    </Button>
                )}
            </div>

            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by title, company..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className={styles.searchInput}
                    />
                </div>

                <div style={{ width: '250px' }}>
                    <LocationSelect
                        value={searchLocation}
                        onChange={val => { setSearchLocation(val); setPage(1); }}
                        placeholder="Filter by City"
                    />
                </div>

                <select
                    className={styles.filterSelect}
                    value={jobType}
                    onChange={e => { setJobType(e.target.value); setPage(1); }}
                >
                    <option value="">All Job Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                </select>

                <select
                    className={styles.filterSelect}
                    value={workMode}
                    onChange={e => { setWorkMode(e.target.value); setPage(1); }}
                >
                    <option value="">All Work Modes</option>
                    <option value="office">Office</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                </select>
            </div>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>Loading vacancies...</div>
                ) : vacancies.length > 0 ? (
                    vacancies.map(v => (
                        <VacancyCard key={v.id} vacancy={v} />
                    ))
                ) : (
                    <div className={styles.empty}>No vacancies found matching your criteria.</div>
                )}
            </div>



            <Pagination
                currentPage={page}
                totalCount={totalCount}
                pageSize={10}
                onPageChange={page => setPage(page)}
            />

            <AddVacancyModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => { fetchVacancies(); setPage(1); }}
            />
        </div>
    );
}
