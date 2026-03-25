"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { business } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Search, MapPin, Building, Globe, Plus, Users } from 'lucide-react';
import styles from './Companies.module.scss';
import Link from 'next/link';
import { debounce } from 'lodash';
import { useTranslation } from '@/i18n/client';
import Pagination from '@/components/ui/Pagination';
import RegisterCompanyModal from './components/RegisterCompanyModal';

const CompanyLogo = ({ company }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <Link href={`/companies/${company.slug}`} className={styles.logoLink}>
            {company.logo && !imgError ? (
                <img
                    src={company.logo}
                    alt={company.name}
                    className={styles.logo}
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className={styles.logoPlaceholder}>
                    {company.name.charAt(0)}
                </div>
            )}
        </Link>
    );
};

export default function CompaniesPage() {
    const { t } = useTranslation('common');
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    // Data State
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    // Filter State
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [companySize, setCompanySize] = useState(searchParams.get('company_size') || '');
    const page = parseInt(searchParams.get('page')) || 1;

    // Modal State
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Load data based on URLSearchParams
    const loadCompanies = async () => {
        try {
            setLoading(true);
            const params = {
                page: searchParams.get('page') || 1,
                search: searchParams.get('search') || '',
                company_size: searchParams.get('company_size') || undefined,
                page_size: 9 // Grid 3x3
            };
            const res = await business.getCompanies(params);

            setCompanies(res.data.results || []);
            setTotalCount(res.data.count || 0);

        } catch (error) {
            console.error("Failed to load companies", error);
        } finally {
            setLoading(false);
        }
    };

    // Ref to hold latest searchParams for debounce
    const searchParamsRef = React.useRef(searchParams);

    useEffect(() => {
        setIsMounted(true);
        searchParamsRef.current = searchParams;

        // Sync URL to State (handle back/forward)
        const currentSearch = searchParams.get('search') || '';
        const currentSize = searchParams.get('company_size') || '';

        // Only update search state if it differs essentially (avoid cursor jumps if possible, 
        // though typically this runs after URL commit which matches input)
        if (currentSearch !== search) {
            // Only force update if we are not "ahead" ? 
            // Actually, if URL changes, we must sync. 
            // If user typed "abc" (state) -> debounce -> URL "abc" -> Effect "abc". State becomes "ab". Correct.
            // If user typed "abc" -> clicked back -> URL "ab" -> Effect "ab". State becomes "ab". Correct.
            setSearch(currentSearch);
        }
        setCompanySize(currentSize);

        // Trigger Load
        loadCompanies();
    }, [searchParams]);

    // Debounced URL Updater
    const debouncedSearch = React.useMemo(
        () => debounce((term) => {
            const params = new URLSearchParams(searchParamsRef.current);
            if (term) params.set('search', term);
            else params.delete('search');
            params.set('page', '1');
            router.push(`?${params.toString()}`);
        }, 500),
        [router]
    );

    // Cleanup debounce
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const onSearchInput = (e) => {
        const val = e.target.value;
        setSearch(val);
        debouncedSearch(val);
    };

    const handleFilterChange = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage);
        router.push(`?${params.toString()}`);
    };

    if (!isMounted) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>{t('companies.title')}</h1>
                    <p>{t('companies.subtitle')}</p>
                </div>
                {user && !user.company_slug && (
                    <Button onClick={() => setShowRegisterModal(true)}>
                        <Plus size={18} /> {t('companies.register_company')}
                    </Button>
                )}
            </div>

            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={t('companies.search_placeholder')}
                        value={search}
                        onChange={onSearchInput}
                        className={styles.searchInput}
                    />
                </div>

                <select
                    className={styles.filterSelect}
                    value={companySize}
                    onChange={(e) => handleFilterChange('company_size', e.target.value)}
                >
                    <option value="">{t('companies.all_sizes')}</option>
                    <option value="1-10">1-10 {t('companies.employees')}</option>
                    <option value="11-50">11-50 {t('companies.employees')}</option>
                    <option value="51-200">51-200 {t('companies.employees')}</option>
                    <option value="201-500">201-500 {t('companies.employees')}</option>
                    <option value="501-1000">501-1000 {t('companies.employees')}</option>
                    <option value="1000+">1000+ {t('companies.employees')}</option>
                </select>
            </div>

            {loading ? (
                <div className={styles.loading}>{t('companies.loading')}</div>
            ) : (
                <>
                    <div className={styles.grid}>
                        {companies.length > 0 ? companies.map(company => (
                            <div key={company.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    {/* Logo Link to Detail */}
                                    <CompanyLogo company={company} />

                                    <div className={styles.info}>
                                        {/* Name Link to Detail */}
                                        <Link href={`/companies/${company.slug}`} className={styles.nameLink}>
                                            <h2>{company.name}</h2>
                                        </Link>

                                        {company.website_url && (
                                            <a href={company.website_url} target="_blank" rel="noreferrer" className={styles.siteLink}>
                                                {new URL(company.website_url).hostname}
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <p className={styles.summary}>
                                    {company.summary?.length > 120 ? company.summary.substring(0, 120) + '...' : company.summary || 'No description available.'}
                                </p>

                                <div className={styles.meta}>
                                    {company.address && (
                                        <div className={styles.metaItem}>
                                            <MapPin size={14} />
                                            <span>{company.address}</span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <Users size={14} />
                                        <span>{company.employees_count || '1-10'} {t('companies.employees')}</span>
                                        {/* Assume mock data or static for now if field missing */}
                                    </div>
                                </div>

                                <Link href={`/companies/${company.slug}`} className={styles.viewBtn}>
                                    {t('companies.view_company')}
                                </Link>
                            </div>
                        )) : (
                            <div className={styles.empty}>
                                <Building size={48} />
                                <h3>{t('companies.empty.title')}</h3>
                                <p>{t('companies.empty.subtitle')}</p>
                            </div>
                        )}
                    </div>
                    {companies.length > 0 && (
                        <Pagination
                            currentPage={page}
                            totalCount={totalCount}
                            pageSize={9}
                            onPageChange={handlePageChange}
                            alwaysShow
                        />
                    )}
                </>
            )}

            <RegisterCompanyModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSuccess={() => {
                    loadCompanies(); // Refresh list
                    // Optional: redirect to new company detail
                }}
            />
        </div>
    );
}
