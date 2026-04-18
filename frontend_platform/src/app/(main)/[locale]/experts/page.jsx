"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import UsersList from './components/UsersList';
import { accounts } from '@/lib/api/accounts';
import axios from 'axios';
import Pagination from '@/components/ui/Pagination';

const Filters = dynamic(() => import('./components/Filters'), {
    ssr: false,
    loading: () => (
        <div className={styles.filtersPlaceholder} aria-hidden>
            <div className={styles.filtersSkeletonLine} />
            <div className={styles.filtersSkeletonLine} />
            <div className={styles.filtersSkeletonLineShort} />
        </div>
    ),
});

function ExpertsPageContent() {
    const { t } = useTranslation('common');

    const [filters, setFilters] = useState({
        search: '',
        profession_sub_category_id: '',
        hard_skills: [],
        soft_skills: [],
        locations: [],
        degree: '',
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const pageRef = useRef(page);
    const filtersRef = useRef(filters);
    const fetchAbortRef = useRef(null);
    pageRef.current = page;
    filtersRef.current = filters;

    const fetchExperts = useCallback(async (signal) => {
        setLoading(true);
        try {
            const p = pageRef.current;
            const f = filtersRef.current;
            const params = { page: p, page_size: 10, ...f };
            if (!params.profession_sub_category_id) delete params.profession_sub_category_id;
            if (!params.degree) delete params.degree;
            if (!params.search) delete params.search;
            const res = await accounts.getExpertsDirectory(params, { signal });
            if (signal?.aborted) return;
            setUsers(res.data.results || res.data);
            setTotalCount(res.data.count || (res.data.results || res.data).length);
        } catch (err) {
            if (axios.isCancel(err) || err.code === 'ERR_CANCELED') return;
            console.error(err);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAbortRef.current?.abort();
        const ac = new AbortController();
        fetchAbortRef.current = ac;
        fetchExperts(ac.signal);
        return () => {
            ac.abort();
        };
    }, [page, fetchExperts]);

    const handleSearch = () => {
        if (page === 1) {
            fetchAbortRef.current?.abort();
            const ac = new AbortController();
            fetchAbortRef.current = ac;
            fetchExperts(ac.signal);
        } else {
            setPage(1);
        }
    };

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

export default function ExpertsPage() {
    return (
        <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
            <ExpertsPageContent />
        </React.Suspense>
    );
}
