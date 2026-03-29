import React from 'react';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import TagsInput from '@/components/ui/TagsInput';
import { City } from 'country-state-city';
import { useState, useMemo } from 'react';

export default function Filters({ values, onChange, onSearch }) {
    const { t } = useTranslation('common');

    // Memoize cities to avoid re-calculation
    const cities = useMemo(() => City.getCitiesOfCountry('AZ'), []);

    const handleChange = (key, val) => {
        onChange(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className={styles.filters}>
            <h3>{t('experts.filters.title')}</h3>

            <Input
                label={t('experts.filters.search')}
                placeholder={t('experts.filters.search_placeholder')}
                value={values.search}
                onChange={e => handleChange('search', e.target.value)}
            />

            <TagsInput
                label={t('experts.filters.hard_skills')}
                placeholder="e.g. Python, Excel..."
                tags={values.hard_skills || []}
                onChange={tags => handleChange('hard_skills', tags)}
            />

            <TagsInput
                label={t('experts.filters.soft_skills')}
                placeholder="e.g. Leadership..."
                tags={values.soft_skills || []}
                onChange={tags => handleChange('soft_skills', tags)}
            />

            <div className={styles.field}>
                <label>{t('experts.filters.degree')}</label>
                <select
                    value={values.degree}
                    onChange={e => handleChange('degree', e.target.value)}
                    className={styles.select}
                >
                    <option value="">{t('experts.filters.all_degrees')}</option>
                    <option value="bachelor">{t('profile_modals.education.bachelor')}</option>
                    <option value="master">{t('profile_modals.education.master')}</option>
                    <option value="doctorate">{t('profile_modals.education.doctorate')}</option>
                    <option value="secondary">{t('profile_modals.education.secondary')}</option>
                    <option value="full_secondary">{t('profile_modals.education.full_secondary')}</option>
                    <option value="vocational">{t('profile_modals.education.vocational')}</option>
                </select>
            </div>

            <TagsInput
                label={t('experts.filters.location')}
                placeholder="e.g. Baku, Sumgait..."
                tags={values.locations || []}
                onChange={tags => handleChange('locations', tags)}
                source={cities}
            />

            <div className={styles.actions}>
                <Button type="primary" onClick={onSearch} className={styles.searchBtn}>
                    {t('experts.search_btn')}
                </Button>
                {/* Clear Filters logic should probably be passed down or handled by resetting values */}
                <button
                    onClick={() => onChange({ search: '', hard_skills: [], soft_skills: [], locations: [], degree: '' })}
                    className={styles.clearBtn}
                >
                    {t('experts.filters.clear')}
                </button>
            </div>
        </div>
    );
}
