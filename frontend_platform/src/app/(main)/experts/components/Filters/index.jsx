import React, { useState, useMemo, useEffect } from 'react';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import TagsInput from '@/components/ui/TagsInput';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { City } from 'country-state-city';
import { ListFilter } from 'lucide-react';
import api from '@/lib/api/client';

const emptyFilters = {
    search: '',
    profession_sub_category_id: '',
    hard_skills: [],
    soft_skills: [],
    locations: [],
    degree: '',
};

export default function Filters({ values, onChange, onSearch }) {
    const { t, i18n } = useTranslation('common');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [allCategories, setAllCategories] = useState([]);

    const cities = useMemo(() => City.getCitiesOfCountry('AZ'), []);
    const currentLang = i18n.language?.split('-')[0] || 'az';
    const langKey = `name_${currentLang}`;
    const profKey = `profession_${currentLang}`;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get('/accounts/categories/');
                if (!cancelled) setAllCategories(data.results || data || []);
            } catch (e) {
                console.error(e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (key, val) => {
        onChange((prev) => ({ ...prev, [key]: val }));
    };

    const resetFilters = () => onChange({ ...emptyFilters });

    return (
        <div className={styles.filters}>
            <h3>{t('experts.filters.title')}</h3>

            <div className={styles.searchRow}>
                <div className={styles.searchField}>
                    <Input
                        label={t('experts.filters.search')}
                        placeholder={t('experts.filters.search_placeholder')}
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
                        aria-controls="experts-advanced-filters"
                        title={t('experts.filters.toggle_advanced')}
                    >
                        <ListFilter size={20} strokeWidth={2} />
                        <span className={styles.filterToggleLabel}>{t('experts.filters.toggle_advanced')}</span>
                    </button>
                </div>
            </div>

            <div
                id="experts-advanced-filters"
                className={`${styles.advancedBlock} ${advancedOpen ? styles.advancedBlockOpen : ''}`}
            >
                <div className={styles.field}>
                    <label>{t('experts.filters.profession')}</label>
                    <div className={styles.professionSelect}>
                        <SearchableSelect
                            options={allCategories}
                            value={values.profession_sub_category_id || ''}
                            onChange={(val) => handleChange('profession_sub_category_id', val || '')}
                            groupBy="subcategories"
                            labelKey={langKey}
                            professionKey={profKey}
                            valueKey="id"
                            placeholder={t('experts.filters.all_professions')}
                        />
                    </div>
                </div>

                <TagsInput
                    label={t('experts.filters.hard_skills')}
                    placeholder="e.g. Python, Excel..."
                    tags={values.hard_skills || []}
                    onChange={(tags) => handleChange('hard_skills', tags)}
                />

                <TagsInput
                    label={t('experts.filters.soft_skills')}
                    placeholder="e.g. Leadership..."
                    tags={values.soft_skills || []}
                    onChange={(tags) => handleChange('soft_skills', tags)}
                />

                <div className={styles.field}>
                    <label>{t('experts.filters.degree')}</label>
                    <select
                        value={values.degree}
                        onChange={(e) => handleChange('degree', e.target.value)}
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
                    onChange={(tags) => handleChange('locations', tags)}
                    source={cities}
                />
            </div>

            <div className={styles.actions}>
                <Button type="primary" onClick={onSearch} className={styles.searchBtn}>
                    {t('experts.search_btn')}
                </Button>
                <button type="button" onClick={resetFilters} className={styles.clearBtn}>
                    {t('experts.filters.clear')}
                </button>
            </div>
        </div>
    );
}
