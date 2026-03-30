"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getArticles } from '@/lib/api/portfolio';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/articles.module.scss';

export default function Articles({ user }) {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
        current: 1
    });
    
    const profile = user?.user || {};
    const username = profile.username;

    const fetchArticles = async (pageUrl = null, searchQuery = '') => {
        setLoading(true);
        try {
            if (!username) return;
            
            const response = await getArticles({
                username: username,
                url: pageUrl,
                search: searchQuery
            });
            
            setArticles(response?.results || []);
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
        if (username) {
            fetchArticles();
        }
    }, [username]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchArticles(null, searchTerm);
    };

    const handleNext = () => {
        if (pagination.next) {
            setPagination(prev => ({ ...prev, current: prev.current + 1 }));
            fetchArticles(pagination.next, searchTerm);
        }
    };

    const handlePrev = () => {
        if (pagination.previous) {
            setPagination(prev => ({ ...prev, current: prev.current - 1 }));
            fetchArticles(pagination.previous, searchTerm);
        }
    };

    if (!isMounted) return null;

    return (
        <div className={styles.articlesWrapper}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <h1>{t('portfolio.medicalInsights')}</h1>
                    <p>{t('portfolio.medicalInsightsDesc')}</p>
                </div>

                <form onSubmit={handleSearch} className={styles.searchBox}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder={t('portfolio.searchArticles') || t('common.search') || 'Axtar...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" style={{ display: 'none' }}>Search</button>
                </form>

                <div className={styles.articleGrid}>
                    {loading ? (
                        <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>
                            <p>{t('portfolio.loadingArticles')}</p>
                        </div>
                    ) : articles.length > 0 ? (
                        articles.map((article, idx) => (
                            <Link 
                                key={article.id || idx} 
                                href={`/${username}/articles/${article.slug || article.id}`}
                                className={styles.articleCard}
                            >
                                <div className={styles.cardImage}>
                                    {article.image ? (
                                        <img 
                                            src={article.image} 
                                            alt={article.title} 
                                            className={styles.bgImg}
                                        />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>
                                            <Calendar size={48} />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardContent}>
                                    <span className={styles.category}>{t('feed.article')}</span>
                                    <h3>{article.title}</h3>
                                    <p>{article.body?.replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
                                </div>
                                <div className={styles.cardFooter}>
                                    <span className={styles.date}>
                                        <Clock size={14} />
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
                                    <span className={styles.readMore}>{t('portfolio.viewArticle')}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>
                            <p>{t('portfolio.noArticles')}</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
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
