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
import Pagination from '@/components/ui/Pagination';
import RegisterCompanyModal from './components/RegisterCompanyModal';

export default function CompaniesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    // Data State
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Filter State
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

    // Modal State
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const params = {
                page: page,
                search: search,
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

    // Debounced search handler
    const handleSearch = debounce((term) => {
        const params = new URLSearchParams(searchParams);
        if (term) params.set('search', term);
        else params.delete('search');

        // Reset to page 1 on search
        params.set('page', '1');
        setPage(1);

        router.replace(`?${params.toString()}`);
        // Trigger load via effect or manual?
        // Ideally effect depends on search state.
    }, 500);

    // Sync URL params to State
    useEffect(() => {
        const p = parseInt(searchParams.get('page')) || 1;
        const s = searchParams.get('search') || '';
        setPage(p);
        setSearch(s);
    }, [searchParams]);

    // Load data when page/search changes
    useEffect(() => {
        loadCompanies();
    }, [page, search]);

    const onSearchInput = (e) => {
        setSearch(e.target.value); // Optimistic UI update for input
        handleSearch(e.target.value); // Debounced URL update
    };

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage);
        router.push(`?${params.toString()}`);
        setPage(newPage);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Discover Companies</h1>
                    <p>Connect with industry leaders and innovators.</p>
                </div>
                {user && (
                    <Button onClick={() => setShowRegisterModal(true)} className={styles.registerBtn}>
                        <Plus size={18} /> Register Company
                    </Button>
                )}
            </div>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Search for companies..."
                        value={search}
                        onChange={onSearchInput}
                    />
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading companies...</div>
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
                                        <span>{company.employees_count || '1-10'} Employees</span>
                                        {/* Assume mock data or static for now if field missing */}
                                    </div>
                                </div>

                                <Link href={`/companies/${company.slug}`} className={styles.viewBtn}>
                                    View Profile
                                </Link>
                            </div>
                        )) : (
                            <div className={styles.empty}>
                                <Building size={48} />
                                <h3>No companies found</h3>
                                <p>Try adjusting your search terms.</p>
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
