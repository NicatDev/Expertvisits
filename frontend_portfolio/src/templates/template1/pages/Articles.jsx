"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Calendar, User as UserIcon } from 'lucide-react';
import { getArticles } from '@/lib/api/portfolio';
import t1Styles from '../styles/template1.module.scss';
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

    const fetchArticles = async (pageUrl = null, searchQuery = '') => {
        setLoading(true);
        try {
            const response = await getArticles({
                username: user.username,
                url: pageUrl,
                search: searchQuery
            });
            
            setArticles(response.data.results || response.data);
            setPagination({
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous,
                current: pageUrl ? pagination.current : 1 // simplified tracking
            });
        } catch (error) {
            console.error("Failed to fetch articles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [user.username]);

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

    return (
        <div className={t1Styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Articles</h1>
                
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Search articles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button type="submit" className={styles.searchButton}>Search</button>
                </form>
            </div>

            {loading ? (
                <div className={styles.loadingState}>Loading articles...</div>
            ) : articles.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No articles found.</p>
                </div>
            ) : (
                <div className={styles.articlesGrid}>
                    {articles.map(article => (
                        <Link href={`/${user.username}/articles/${article.slug}`} key={article.id} className={styles.articleCard}>
                            {article.thumbnail && (
                                <div className={styles.thumbnailWrapper}>
                                    <img src={article.thumbnail} alt={article.title} className={styles.thumbnail} />
                                </div>
                            )}
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>{article.title}</h2>
                                <p className={styles.cardExcerpt}>
                                    {article.body ? article.body.replace(/(<([^>]+)>)/ig, '').substring(0, 120) + '...' : ''}
                                </p>
                                <div className={styles.cardMeta}>
                                    <span className={styles.metaItem}>
                                        <Calendar size={14} /> 
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
                                    <span className={styles.metaItem}>
                                        <UserIcon size={14} /> 
                                        {article.author.first_name || article.author.username}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
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
                        <ChevronLeft size={18} /> Prev
                    </button>
                    <span className={styles.pageInfo}>Page {pagination.current}</span>
                    <button 
                        onClick={handleNext} 
                        disabled={!pagination.next}
                        className={styles.pageButton}
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
