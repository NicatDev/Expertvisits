"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Calendar, User as UserIcon, Book } from 'lucide-react';
import { getArticles } from '@/lib/api/portfolio';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/articles.module.scss';

export default function Articles({ user }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
        current: 1
    });
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    
    const passedUsername = user?.user?.username || user?.username;

    const fetchArticles = async (pageUrl = null, searchQuery = '') => {
        setLoading(true);
        try {
            if (!passedUsername) return;
            
            const response = await getArticles({
                username: passedUsername,
                url: pageUrl,
                search: searchQuery
            });
            
            setArticles(response?.results || response.data);
            console.log(response.results)
            setPagination(prev => ({
                count: response?.count || 0,
                next: response?.next,
                previous: response?.previous,
                current: pageUrl ? prev.current : 1
            }));
        } catch (error) {
            console.error("Failed to fetch articles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        if (passedUsername) {
            fetchArticles();
        }
    }, [user, passedUsername]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchArticles(null, search);
    };

    const handleNext = () => {
        if (pagination.next) {
            setPagination(prev => ({ ...prev, current: prev.current + 1 }));
            fetchArticles(pagination.next, search);
        }
    };

    const handlePrev = () => {
        if (pagination.previous) {
            setPagination(prev => ({ ...prev, current: prev.current - 1 }));
            fetchArticles(pagination.previous, search);
        }
    };

    if (!isMounted) return null;

    return (
        <div style={{ backgroundColor: '#05050f', minHeight: '100vh', width: '100%' }}>
            <div className={styles.articlesContainer}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>{t('portfolio.myWritings')} </h1>
                    
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <div className={styles.searchInputWrapper}>
                            <Search size={18} className={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder={t('portfolio.searchArticles')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <button type="submit" className={styles.searchButton}>{t('portfolio.search')}</button>
                    </form>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>{t('portfolio.loadingArticles')}</div>
                ) : articles?.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>{t('portfolio.noArticles')}</p>
                    </div>
                ) : (
                    <div className={styles.articlesGrid}>
                        {articles?.map(article => {
                            // ArticlePublicSerializer uses 'image', not 'thumbnail'
                            const imgUrl = article.image;
                            
                            return (
                                <Link href={`/${passedUsername}/articles/${article.slug}`} key={article.id} className={styles.articleCard}>
                                    {imgUrl ? (
                                        <div className={styles.thumbnailWrapper}>
                                            <img src={imgUrl} alt={article.title} className={styles.thumbnail} />
                                        </div>
                                    ) : (
                                        <div className={styles.thumbnailWrapper}>
                                            {/* Placeholder background for articles without image */}
                                            <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a24', color: '#4facfe'}}>
                                                <Book size={48} opacity={0.5} />
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.cardContent}>
                                        <h2 className={styles.cardTitle}>{article.title}</h2>
                                        <p className={styles.cardExcerpt}>
                                            {article.body ? article.body.replace(/(<([^>]+)>)/ig, '').substring(0, 100) + '...' : ''}
                                        </p>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}>
                                                <Calendar size={14} /> 
                                                {new Date(article.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={styles.metaItem}>
                                                <UserIcon size={14} /> 
                                                {article.author?.first_name || article.author?.username || user.username}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {(pagination.next || pagination.previous) && (
                    <div className={styles.pagination}>
                        <button 
                            onClick={handlePrev} 
                            disabled={!pagination.previous}
                            className={styles.pageButton}
                        >
                            <ChevronLeft size={18} /> {t('portfolio.prev')}
                        </button>
                        <span className={styles.pageInfo}>{t('portfolio.page')} {pagination.current}</span>
                        <button 
                            onClick={handleNext} 
                            disabled={!pagination.next}
                            className={styles.pageButton}
                        >
                            {t('portfolio.next')} <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
