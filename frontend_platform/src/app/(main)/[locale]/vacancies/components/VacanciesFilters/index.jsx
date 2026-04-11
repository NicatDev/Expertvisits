'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LocationSelect from '@/components/ui/LocationSelect';
import { ListFilter } from 'lucide-react';
import styles from './style.module.scss';

export const emptyVacancyFilters = {
  search: '',
  searchLocation: '',
  jobType: '',
  workMode: '',
};

export default function VacanciesFilters({ values, onChange, onSearch }) {
  const { t } = useTranslation('common');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleChange = (key, val) => {
    onChange((prev) => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => onChange({ ...emptyVacancyFilters });

  return (
    <div className={styles.filters}>
      <h3>{t('vacancies.filters.title')}</h3>

      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <Input
            label={t('vacancies.filters.search')}
            placeholder={t('vacancies.search_placeholder')}
            value={values.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>
        <div className={styles.mobileSearchActions}>
          <button
            type="button"
            className={`${styles.filterToggle} ${advancedOpen ? styles.filterToggleActive : ''}`}
            onClick={() => setAdvancedOpen((o) => !o)}
            aria-expanded={advancedOpen}
            aria-controls="vacancies-advanced-filters"
            aria-label={t('vacancies.filters.toggle_advanced')}
            title={t('vacancies.filters.toggle_advanced')}
          >
            <ListFilter size={24} strokeWidth={2.75} aria-hidden />
          </button>
        </div>
      </div>

      <div
        id="vacancies-advanced-filters"
        className={`${styles.advancedBlock} ${advancedOpen ? styles.advancedBlockOpen : ''}`}
      >
        <div className={styles.field}>
          <label>{t('vacancies.filter_city')}</label>
          <LocationSelect
            value={values.searchLocation}
            onChange={(val) => handleChange('searchLocation', val)}
            placeholder={t('vacancies.filter_city')}
          />
        </div>

        <div className={styles.field}>
          <label>{t('vacancies.filters.job_type')}</label>
          <select
            className={styles.select}
            value={values.jobType}
            onChange={(e) => handleChange('jobType', e.target.value)}
          >
            <option value="">{t('vacancies.all_job_types')}</option>
            <option value="full-time">{t('vacancies.full_time')}</option>
            <option value="part-time">{t('vacancies.part_time')}</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>{t('vacancies.filters.work_mode')}</label>
          <select
            className={styles.select}
            value={values.workMode}
            onChange={(e) => handleChange('workMode', e.target.value)}
          >
            <option value="">{t('vacancies.all_work_modes')}</option>
            <option value="office">{t('vacancies.office')}</option>
            <option value="remote">{t('vacancies.remote')}</option>
            <option value="hybrid">{t('vacancies.hybrid')}</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="primary" onClick={onSearch} className={styles.searchBtn}>
          {t('vacancies.search_btn')}
        </Button>
        <button type="button" onClick={resetFilters} className={styles.clearBtn}>
          {t('vacancies.filters.clear')}
        </button>
      </div>
    </div>
  );
}
