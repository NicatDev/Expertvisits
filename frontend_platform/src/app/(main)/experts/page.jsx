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
    const [hasMore, setHasMore] = useState(false);
    const [searched, setSearched] = useState(false); // Track if user performed a specific filter search

    // Fetch users
    const fetchUsers = async (reset = false) => {
        setLoading(true);
        try {
            const params = {
                page: reset ? 1 : page,
                ...filters
            };
            const res = await api.get('accounts/users/', { params });

            if (reset) {
                setUsers(res.data || []);
            } else {
                setUsers(prev => [...prev, ...res.data.results || []]);
            }
            setHasMore(!!res.data.next);
            if (!reset) setPage(prev => prev + 1);
            else setPage(2);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(true);
    }, []); // Initial load (6 random/recent)

    const handleSearch = () => {
        setSearched(true);
        fetchUsers(true);
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
                <h2 suppressHydrationWarning>{t('experts.auth_required_title')}</h2>
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
                    <Filters values={filters} onChange={setFilters} onSearch={handleSearch} />
                </div>
                <div className={styles.content}>
                    <UsersList users={users} loading={loading} />
                    {hasMore && (
                        <button
                            className={styles.loadMore}
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading ? t('common.loading') : t('experts.load_more')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
  
}
