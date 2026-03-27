"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './style.module.scss';
import Filters from './components/Filters';
import UsersList from './components/UsersList';
import api from '@/lib/api/client';
import Link from 'next/link';
import RecommendedUsers from '@/components/widgets/RecommendedUsers';
import Pagination from '@/components/ui/Pagination';

export default function ExpertsPage() {
    const { t } = useTranslation('common');
    const { user } = useAuth();

    // Auth Check


    const [filters, setFilters] = useState({
        search: '',
        skill: '',
        degree: '',
        city: ''
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searched, setSearched] = useState(false);

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                ...filters
            };
            const res = await api.get('accounts/users/', { params });
            setUsers(res.data.results || res.data);
            setTotalCount(res.data.count || (res.data.results || res.data).length);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleSearch = () => {
        setSearched(true);
        if (page === 1) fetchUsers();
        else setPage(1);
    };

    const handleLoadMore = () => {
        // Validation for spam prevention
        const hasFilters = Object.values(filters).some(val => val && val !== '');
        if (!hasFilters && !searched) {
            alert(t('experts.spam_warning'));
            return;
        }
        fetchUsers(false);
    };

    if (!loading && !user) {
        return (
            <div className={styles.authWarning}>
                <h1 suppressHydrationWarning>{t('experts.auth_required_title')}</h1>
                <p suppressHydrationWarning>{t('experts.auth_required_desc')}</p>
                <Link href="/login" className={styles.loginBtn} suppressHydrationWarning>{t('experts.login_to_continue')}</Link>
            </div>
        );
    }


    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>{t('experts.title')}</h1>
                <p>{t('experts.subtitle')}</p>
            </div>

            <div className={styles.mainLayout}>
                <div className={styles.sidebar}>
                    <h2 className="visually-hidden">{t('experts.filters_title', { defaultValue: 'Filters' })}</h2>
                    <Filters values={filters} onChange={setFilters} onSearch={handleSearch} />
                </div>
                <div className={styles.content}>
                    <h2 className="visually-hidden">{t('experts.list_title', { defaultValue: 'Experts List' })}</h2>
                    <UsersList users={users} loading={loading} />
                    <Pagination
                        currentPage={page}
                        totalCount={totalCount}
                        pageSize={10}
                        onPageChange={setPage}
                        alwaysShow={true}
                        className={styles.pagination}
                    />
                </div>
            </div>
        </div>
    );
  
}
