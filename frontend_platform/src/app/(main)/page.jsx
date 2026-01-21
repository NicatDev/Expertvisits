"use client";
import React, { useState, useEffect } from 'react';
import { content } from '@/lib/api';
import Button from '@/components/ui/Button';
import FeedItem from '@/components/advanced/FeedItem';
import CreateArticleModal from '@/components/advanced/CreateArticleModal';
import CreateQuizModal from '@/components/advanced/CreateQuizModal';
import CreatePollModal from '@/components/advanced/CreatePollModal';
import ContentSelectionModal from '@/components/advanced/ContentSelectionModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './style.module.scss';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import PopularArticles from '@/components/widgets/PopularArticles';
import RecommendedUsers from '@/components/widgets/RecommendedUsers';
import { useTranslation } from '@/i18n/client';

export default function HomePage() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false); // Selection
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);

    // Filters & Search
    const [filterType, setFilterType] = useState('all'); // article, quiz
    const [ordering, setOrdering] = useState('created_at'); // created_at, popularity
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 600); // 600ms delay to detect "finish writing"

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Trigger (Reset)
    useEffect(() => {
        loadFeed(1, true);
    }, [filterType, ordering, debouncedSearch]);

    const loadFeed = async (pageNo = 1, reset = false) => {
        if (reset) {
            setLoading(true);
            setArticles([]);
            setPage(1);
            setHasMore(true);
        } else {
            // Loading more logic could utilize a small separate loading state if desired, 
            // but we reused 'loading' which masks the whole feed. 
            // Better to have separate loading for "more" or just not mask everything.
            // keeping simple for now, maybe just don't set global loading if load more
        }

        try {
            const params = {
                type: filterType,
                ordering: ordering,
                search: debouncedSearch,
                page: pageNo,
                limit: 10
            };
            const { data } = await content.getFeed(params);
            const newItems = data.results || [];

            if (reset) {
                setArticles(newItems);
            } else {
                setArticles(prev => {
                    const existingIds = new Set(prev.map(p => `${p.type || 'article'}-${p.id}`));
                    const uniqueNewItems = newItems.filter(item => !existingIds.has(`${item.type || 'article'}-${item.id}`));
                    return [...prev, ...uniqueNewItems];
                });
            }

            // Check if more
            if (newItems.length < 10) {
                setHasMore(false);
            } else {
                if (data.count && (pageNo * 10) >= data.count) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }
            setPage(pageNo);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        loadFeed(page + 1, false);
    };

    const handleCreateClick = () => {
        if (!user) {
            toast.info("Please login to create content");
            return;
        }
        setShowCreateModal(true);
    };

    return (
        <div className={styles.container}>
            {/* Left Sidebar: Recommended Users & Custom Stats */}
            <aside>
                {/* 1. Recommended Users */}
                <RecommendedUsers />

                {/* 2. User Stats / Welcome (Optional, keeping original if desired or user can ask to remove) */}

            </aside>

            {/* Center: Feed */}
            <section>
                {/* 1. Create Post Section (Moved Top) */}
                <div className={styles.createBox} onClick={handleCreateClick}>
                    <div className={styles.placeholderInput}>
                        {t('feed.placeholder')}
                    </div>
                </div>

                {/* 2. Controls Section (Filters, Search, Ordering) */}
                <div className={styles.controlsBox}>
                    <div className={styles.leftGroup}>
                        {/* Filters */}
                        <div className={styles.filters}>
                            {['all', 'article', 'quiz'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={filterType === type ? styles.active : ''}
                                >
                                    {t(`feed.${type}`)}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className={styles.searchWrapper}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Ordering */}
                    <select
                        value={ordering}
                        onChange={(e) => setOrdering(e.target.value)}
                    >
                        <option value="created_at">{t('feed.latest')}</option>
                        <option value="popularity">{t('feed.popular')}</option>
                    </select>
                </div>

                {/* Feed Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid #ccc', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                ) : (
                    <div className={styles.feedList}>
                        {articles.length > 0 ? articles.map(article => (
                            <FeedItem key={`${article.type || 'article'}-${article.id}`} item={article} />
                        )) : (
                            <div className={styles.emptyState}>
                                <p>{t('feed.no_results')}</p>
                                <Button type="link" onClick={handleCreateClick}>{t('feed.create_content')}</Button>
                            </div>
                        )}

                        {hasMore && articles.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                                <Button
                                    type="default"
                                    onClick={handleLoadMore}
                                >
                                    {t('feed.load_more')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Right Sidebar: Popular Articles */}
            <aside>
                <PopularArticles />

                {/* Keeping Trending if user wants, or remove? User: "Sag sidebarda en popular 3 meqale olsun". 
                    I'll keep Trending below it or replace it? User said "kicik ve lazimli melumatlar". 
                    Usually one main widget is good. I'll remove trends to clean up or push down. 
                    I'll keep it for now as "Trending" fits the theme, but maybe push down. */}

            </aside>

            <ContentSelectionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSelect={(type) => {
                    setShowCreateModal(false);
                    if (type === 'article') {
                        setShowArticleModal(true);
                    }
                    if (type === 'poll') {
                        setShowPollModal(true);
                    }
                    if (type === 'quiz') setShowQuizModal(true);
                }}
            />
            <CreateArticleModal
                isOpen={showArticleModal}
                onClose={() => setShowArticleModal(false)}
                onSuccess={() => {
                    setFilterType('article'); // Or current tab? Maybe keep as is, user will likely want to see what they created.
                    loadFeed(1, true);
                }}
            />
            <CreatePollModal
                isOpen={showPollModal}
                onClose={() => setShowPollModal(false)}
                onSuccess={() => {
                    setFilterType('poll');
                    loadFeed(1, true);
                }}
            />
            <CreateQuizModal
                isOpen={showQuizModal}
                onClose={() => setShowQuizModal(false)}
                onSuccess={() => {
                    setFilterType('quiz');
                    loadFeed(1, true);
                }}
            />
        </div>
    );
}
