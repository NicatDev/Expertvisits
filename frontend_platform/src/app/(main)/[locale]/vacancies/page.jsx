'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { business } from '@/lib/api';
import VacancyCard from '@/components/advanced/VacancyCard';
import AddVacancyModal from '@/components/advanced/AddVacancyModal';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import styles from './style.module.scss';
import { useAuth } from '@/lib/contexts/AuthContext';
import Pagination from '@/components/ui/Pagination';
import { useTranslation } from '@/i18n/client';
import { emptyVacancyFilters } from './components/VacanciesFilters';

const VacanciesFiltersDynamic = dynamic(() => import('./components/VacanciesFilters'), {
  ssr: false,
  loading: () => (
    <div className={styles.filtersPlaceholder} aria-hidden>
      <div className={styles.filtersSkeletonLine} />
      <div className={styles.filtersSkeletonLine} />
      <div className={styles.filtersSkeletonLineShort} />
    </div>
  ),
});

function VacanciesPageContent() {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  const [filters, setFilters] = useState({ ...emptyVacancyFilters });
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const pageRef = useRef(page);
  const filtersRef = useRef(filters);
  pageRef.current = page;
  filtersRef.current = filters;

  const fetchVacancies = useCallback(async () => {
    setLoading(true);
    try {
      const p = pageRef.current;
      const f = filtersRef.current;
      const params = {
        page: p,
        search: f.search || undefined,
        job_type: f.jobType || undefined,
        work_mode: f.workMode || undefined,
        location: f.searchLocation || undefined,
      };
      const res = await business.getVacancies(params);
      setVacancies(res.data.results || res.data);
      setTotalCount(res.data.count || (res.data.results || res.data).length);
    } catch (err) {
      console.error('Failed to load vacancies', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVacancies();
  }, [page, fetchVacancies]);

  const handleSearch = () => {
    if (page === 1) {
      fetchVacancies();
    } else {
      setPage(1);
    }
  };

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

      <div className={styles.mainLayout}>
        <div className={styles.sidebar}>
          <h2 className="visually-hidden">{t('vacancies.filters_title')}</h2>
          <VacanciesFiltersDynamic values={filters} onChange={setFilters} onSearch={handleSearch} />
        </div>
        <div className={styles.content}>
          <h2 className="visually-hidden">{t('vacancies.list_title')}</h2>
          <div className={styles.grid}>
            {loading ? (
              <div className={styles.loading}>{t('vacancies.loading')}</div>
            ) : vacancies.length > 0 ? (
              vacancies.map((v) => <VacancyCard key={v.id} vacancy={v} />)
            ) : (
              <div className={styles.empty}>{t('vacancies.empty')}</div>
            )}
          </div>

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

      <AddVacancyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchVacancies();
          setPage(1);
        }}
      />
    </div>
  );
}

export default function VacanciesPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <VacanciesPageContent />
    </React.Suspense>
  );
}
