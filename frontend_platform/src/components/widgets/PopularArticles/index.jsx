"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import api from '@/lib/api/client';
import styles from './style.module.scss';
import { Heart } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

const PopularArticles = () => {
    const { t } = useTranslation('common');
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchPopularParams();
    }, []);

    const fetchPopularParams = async () => {
        try {
            // Fetch top 3 article by popularity
            const { data } = await api.get('/content/feed/', {
                params: {
                    type: 'article',
                    ordering: 'popularity',
                    // Default DRF pagination usually returns {results, count}.
                    // FeedView for 'article' uses standard pagination.
                    // We just want first page, assume default page size covers it or request small page?
                    // Let's rely on standard page (usually 10) and slice.
                }
            });
            // Handle both paginated and non-paginated responses just in case
            const list = data.results || data;
            setArticles(list.slice(0, 3));
        } catch (error) {
            console.error("Failed to load popular articles", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return <div className={styles.container}>...</div>;
    if (loading) return <div className={styles.container}>{t('widgets.loading')}</div>;
    if (articles.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{t('widgets.popular_articles')}</h3>
            <div className={styles.list}>
                {articles.map(article => (
                    <Link
                        href={withLocale(pathLocale || defaultLocale, `/article/${article.slug}`)}
                        key={article.id}
                        className={styles.item}
                    >
                        {article.image && (
                            <img src={article.image} alt={article.title} className={styles.image} />
                        )}
                        <div className={styles.content}>
                            <span className={styles.itemTitle}>{article.title}</span>
                            <div className={styles.meta}>
                                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Heart size={10} fill="currentColor" /> {article.likes_count}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default PopularArticles;
