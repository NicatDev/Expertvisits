"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Calendar, User as UserIcon } from 'lucide-react';
import { getArticles } from '@/lib/api/portfolio';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/articles.module.scss';

export default function Articles({ user }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null, current: 1 });
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    
    const passedUsername = user?.user?.username || user?.username;

    const fetchArticles = async (pageUrl = null, query = '') => {
        setLoading(true);
        try {
            if (!passedUsername) return;
            const response = await getArticles({ username: passedUsername, url: pageUrl, search: query });
            setArticles(response?.results || response.data || []);
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
        if (passedUsername) { fetchArticles(); }
    }, [user, passedUsername]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchArticles(null, searchQuery);
    };

    const handlePageChange = (type) => {
        if (type === 'next' && pagination.next) {
            setPagination(prev => ({ ...prev, current: prev.current + 1 }));
            fetchArticles(pagination.next, searchQuery);
        } else if (type === 'prev' && pagination.previous) {
            setPagination(prev => ({ ...prev, current: prev.current - 1 }));
            fetchArticles(pagination.previous, searchQuery);
        }
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    if (!isMounted) return null;

    return (
        <div className={styles.articlesContainer}>
            <div className={styles.header}>
                <h1>{t('portfolio.myWritings')} </h1>
                
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={t('portfolio.searchArticles')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button type="submit" className={styles.searchButton}>
                        {t('portfolio.search')}
                    </button>
                </form>
            </div>

            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 className={styles.spinner} size={32} />
                    <p style={{marginTop:'12px'}}>{t('portfolio.loading')}</p>
                </div>
            ) : articles.length > 0 ? (
                <>
                    <div className={styles.articlesGrid}>
                        {articles.map((article) => {
                            const excerpt = stripHtml(article.body).substring(0, 100) + '...';
                            const imgUrl = article.image;
                            
                            return (
                                <Link href={`/${passedUsername}/articles/${article.slug}`} key={article.id} className={styles.articleCard}>
                                    {imgUrl ? (
                                        <div className={styles.thumbnailWrapper}>
                                            <img src={imgUrl} alt={article.title} className={styles.thumbnail} />
                                        </div>
                                    ) : (
                                        <div className={styles.thumbnailWrapper}>
                                            <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', background:'#1e293b'}}>
                                                <UserIcon size={40} opacity={0.5} />
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.cardContent}>
                                        <h3 className={styles.cardTitle}>{article.title}</h3>
                                        <p className={styles.cardExcerpt}>{excerpt}</p>
                                        
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}>
                                                <Calendar size={14} />
                                                {new Date(article.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={styles.metaItem}>
                                                <UserIcon size={14} />
                                                {article.author?.first_name || article.author?.username || passedUsername}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {(pagination.next || pagination.previous) && (
                        <div className={styles.pagination}>
                            <button className={styles.pageButton} onClick={() => handlePageChange('prev')} disabled={!pagination.previous}>
                                {t('portfolio.prev')}
                            </button>
                            <span className={styles.pageInfo}>{t('portfolio.page')} {pagination.current}</span>
                            <button className={styles.pageButton} onClick={() => handlePageChange('next')} disabled={!pagination.next}>
                                {t('portfolio.next')}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.emptyState}>
                    {t('portfolio.noArticles')}
                </div>
            )}
        </div>
    );
}
