"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import NoContent from '@/components/ui/NoContent';
import FeedItem from '@/components/advanced/FeedItem';
import CreateArticleModal from '@/components/advanced/CreateArticleModal';
import CreateQuizModal from '@/components/advanced/CreateQuizModal';
import CreatePollModal from '@/components/advanced/CreatePollModal';
import ContentSelectionModal from '@/components/advanced/ContentSelectionModal';
import styles from '../profile.module.scss';
import api from '@/lib/api/client';
import { toast } from 'react-toastify';
import { useProfile } from '../context';

export default function PostsPage() {
    const { t } = useTranslation('common');
    const { profile, refreshProfile, isOwner } = useProfile();

    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('all');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);

    useEffect(() => {
        loadUserContent(1, filterType, true);
    }, [filterType]);

    const loadUserContent = async (pageNum = 1, type = 'all', reset = false) => {
        if (reset) {
            setPosts([]);
            setPage(1);
            setHasMore(true);
        }
        setLoading(true);
        try {
            const { data } = await api.get('/content/my-feed/', {
                params: {
                    type: type,
                    page: pageNum,
                    limit: 5
                }
            });

            const newPosts = data.results;
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            if (data.next) {
                setHasMore(true);
            } else {
                setHasMore(false);
            }
            setPage(pageNum);

        } catch (err) {
            console.error("Failed to load posts", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <h3>{t('profile.tabs.posts')}</h3>
                <div className={styles.filtersWrapper}>
                    <div className={styles.filters}>
                        {['all', 'article', 'quiz', 'poll'].map(ft => (
                            <Button
                                key={ft}
                                size="small"
                                className={filterType === ft ? styles.activeFilter : styles.filterBtn}
                                onClick={() => setFilterType(ft)}
                            >
                                {ft === 'all' ? t('profile.filters.all') : ft === 'article' ? t('profile.filters.articles') : ft === 'quiz' ? t('profile.filters.quizzes') : t('create_modal.poll_tab')}
                            </Button>
                        ))}
                    </div>
                    {isOwner && <Button onClick={() => setShowCreateModal(true)}>+ {t('profile.content.add_content')}</Button>}
                </div>
            </div>

            <div className={styles.list} style={{ flexDirection: 'column', gap: '16px' }}>
                {posts.map(item => (
                    <FeedItem
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                    />
                ))}

                {posts.length === 0 && !loading && <NoContent message={t('profile.content.no_content')} />}

                {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <Button
                            type="default"
                            loading={loading}
                            onClick={() => loadUserContent(page + 1, filterType)}
                        >
                            {t('profile.content.load_more')}
                        </Button>
                    </div>
                )}
            </div>

            {isOwner && (
                <>
                    <ContentSelectionModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onSelect={(type) => {
                            setShowCreateModal(false);
                            if (type === 'article') setShowArticleModal(true);
                            if (type === 'quiz') setShowQuizModal(true);
                            if (type === 'poll') setShowPollModal(true);
                        }}
                    />
                    <CreateArticleModal
                        isOpen={showArticleModal}
                        onClose={() => setShowArticleModal(false)}
                        onSuccess={() => {
                            loadUserContent(1, 'article', true);
                            refreshProfile();
                            toast.success(t('profile.content.created_success'));
                        }}
                    />
                    <CreateQuizModal
                        isOpen={showQuizModal}
                        onClose={() => setShowQuizModal(false)}
                        onSuccess={() => {
                            loadUserContent(1, 'quiz', true);
                            refreshProfile();
                            toast.success(t('profile.content.created_success'));
                        }}
                    />
                    <CreatePollModal
                        isOpen={showPollModal}
                        onClose={() => setShowPollModal(false)}
                        onSuccess={() => {
                            loadUserContent(1, 'poll', true);
                            refreshProfile();
                            toast.success(t('profile.content.created_success'));
                        }}
                    />
                </>
            )}
        </div>
    );
}
