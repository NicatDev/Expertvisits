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
import { Search, SlidersHorizontal, Check, ChevronDown, Plus } from 'lucide-react';
import PopularArticles from '@/components/widgets/PopularArticles';
import RecommendedUsers from '@/components/widgets/RecommendedUsers';
import PromoBanner from '@/components/widgets/PromoBanner';
import NoContent from '@/components/ui/NoContent';
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
    const [scope, setScope] = useState('all'); // all, following
    const [showFilters, setShowFilters] = useState(false);

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
    }, [filterType, ordering, scope, debouncedSearch]);

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
                scope: scope,
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
            <aside className={styles.leftSidebar}>
                {/* 1. Recommended Users */}
                <RecommendedUsers />

                {/* 2. Promo Banner */}
                <PromoBanner />

                {/* 2. User Stats / Welcome (Optional, keeping original if desired or user can ask to remove) */}

            </aside>

            {/* Center: Feed */}
            <section className={styles.mainFeed}>
                <h1 className="visually-hidden">
                    {t('seo.home_h1', { defaultValue: 'Expert Visits - Professional Experts, Companies and Job Vacancies Platform' })}
                </h1>
                {/* 1. Main Search Bar (Moved Top) */}
                <div className={styles.createBox} style={{ cursor: 'text', padding: '12px 20px', display: 'flex', alignItems: 'center' }}>
                    <Search size={22} color="#999" style={{ marginRight: '12px', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder={t('common.search', "Axtarış üçün nəsə yazın...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '15px', color: '#333' }}
                    />
                </div>

                {/* 2. Controls Section (Filters, Ordering) */}
                <div className={styles.controlsBox}>
                    <div className={styles.leftGroup}>
                        {/* Filters */}
                        <div className={styles.filters}>
                            {['all', 'article', 'quiz', 'poll'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={filterType === type ? styles.active : ''}
                                >
                                    {t(`feed.${type}`)}
                                </button>
                            ))}
                        </div>

                        {/* Create Post Button */}
                        <div className={styles.createBtnWrapper}>
                            <Button type="primary" onClick={handleCreateClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '8px 20px', fontWeight: '600' }}>
                                <Plus size={18} strokeWidth={2.5} />
                                {t('common.create_post', 'Post yarat')}
                            </Button>
                        </div>
                    </div>

                    {/* Ordering & Scope (More Options) */}
                    <div style={{ position: 'relative' }}>
                        <button
                            className={styles.filterBtn}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd',
                                background: '#fff', cursor: 'pointer'
                            }}
                        >
                            <SlidersHorizontal size={16} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{t('common.filter', { defaultValue: 'Filters' })}</span>
                        </button>

                        {showFilters && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                padding: '16px', minWidth: '220px', zIndex: 10, border: '1px solid #eee'
                            }}>
                                {/* View Mode */}
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#999' }}>{t('feed.view_mode')}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            <input
                                                type="radio"
                                                name="scope"
                                                checked={scope === 'all'}
                                                onChange={() => { setScope('all'); setShowFilters(false); }}
                                            />
                                            {t('feed.view_all')}
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            <input
                                                type="radio"
                                                name="scope"
                                                checked={scope === 'following'}
                                                onChange={() => {
                                                    if (!user) { toast.info('Please login'); return; }
                                                    setScope('following');
                                                    setShowFilters(false);
                                                }}
                                            />
                                            {t('feed.view_following')}
                                        </label>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ height: '1px', background: '#eee', margin: '0 -16px 16px -16px' }} />

                                {/* Sort By */}
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#999' }}>{t('feed.sort_by')}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            <input
                                                type="radio"
                                                name="ordering"
                                                checked={ordering === 'created_at'}
                                                onChange={() => { setOrdering('created_at'); setShowFilters(false); }}
                                            />
                                            {t('feed.latest')}
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            <input
                                                type="radio"
                                                name="ordering"
                                                checked={ordering === 'popularity'}
                                                onChange={() => { setOrdering('popularity'); setShowFilters(false); }}
                                            />
                                            {t('feed.popular')}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Overlay to close */}
                        {showFilters && (
                            <div
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }}
                                onClick={() => setShowFilters(false)}
                            />
                        )}
                    </div>
                </div>




                {/* Feed Content */}
                <h2 className="visually-hidden">
                    {t('seo.home_h2', { defaultValue: 'Latest Posts and Articles' })}
                </h2>
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
                                <NoContent message={t('feed.no_results')} />
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
            <aside className={styles.rightSidebar}>
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
